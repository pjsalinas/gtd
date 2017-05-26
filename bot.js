/**
 * Getting Things Done (/gtd). A conextion between Slack Slash Command and Airtable.
 * version: 1.0
 * date:
 */

'use-strict';

const promiseDelay = require('promise-delay');
const aws = require('aws-sdk');
const lambda = new aws.Lambda();
const botBuilder = require('claudia-bot-builder');
const slackDelayedReply = botBuilder.slackDelayedReply;

var Airtable = require('airtable');
const _ = require('lodash');

// json of the categories
let categories = {
	nextactions: 'Next Actions',
	athome: 'At Home',
	atwork: 'At Work',
	tocall: 'To Call',
	waitingfor: 'Waiting For',
	add: 'Add',
	help: 'Help',
	done: 'Complete',
	delete: 'Delete'
};

// this are the catetories
let views = _.keys(categories);

const api = botBuilder((message, apiRequest) => {

	const text = message.text;
	const action = _.first(_.split(text, " "));

	if(_.includes(views, action)) {

		if(action === 'help' || action === 'Help'){
			return 'Hey, "/gtd" help you to manage your Airtable tasks.\n' +
				'• List "Next Actions" tasks: `/gtd nextactions`\n' +
				'• List "At Home" tasks: `/gtd athome`\n' +
				'• List "At Work" tasks: `/gtd atwork`\n' +
				'• List "To Call" tasks: `/gtd tocall`\n' +
				'• List "Waiting For" tasks: `/gtd waitingfor`\n' +
				'• To mark a task as "Complete": `/gtd done _taskId_`\n' +
				'• To "Delete" a task: `/gtd delete _taskId_`\n' +
				'• To add a new task `/gtd add _Task Name_, _Category_, _Next Actions (yes or no)_, _Date_`\n' +
				'Or, `/gtd add Remember The Milk, athome, yes, 2017-05-25`\n' +
				'Next Actions and Date are optional.\n' +
				'Not use this yet: `/gtd add Remember The Milk, athome, 2017-05-25`\n' +
				'will be fixed next time';
		}

		var view = categories[action];

		return new Promise((resolve, reject) => {
			lambda.invoke({
				FunctionName: apiRequest.lambdaContext.functionName,
				InvocationType: 'Event',
				Payload: JSON.stringify({
					slackEvent: message,
					lambdaVersion: apiRequest.env.lambdaVersion
				}),
				Qualifier: apiRequest.lambdaContext.functionVersion
			}, (err, done) => {
				if(err) return reject(err);

				resolve();
			});
		})
		.then(() => {

			return {
				text: `${view} tasks`,
				response_type: 'in_channel'
			}
		})
		.catch(() => {
			return `Could not setup timer :(`
		});
	} else {
		return 'Wow, I don\'t know that. Valid commands: `nextactions`, `athome`, `atwork`, `tocall`, `waitingfor`, `add`, and `help`.';
	}
});

api.intercept((event) => {

	if(!event.slackEvent)
		return event;

	// info on payload
	const message = event.slackEvent;
	const seconds = 2; //event.seconds;
	const view = event.view;

	var text = '';

	//var text = 'add task name, nextaction, next, 2017-05-24';
	var splitted = _.split(message.text, ",");
	var action = _.first(_.split(splitted[0], " "));
	var name = _.join(_.drop(_.split(splitted[0], " ")), " ");

	var cat = _.trim(splitted[1]);
	var nextAction = _.trim(splitted[2]);
	var date = _.trim(splitted[3]);

	var base = new Airtable({
		apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_GTD);

	var getRecord = (handler) => {

		base('Tasks').select({
			view: 'Uncomplete',
			field: 'Handler'
		}).firstPage(function(err, records) {
			if (err) { console.error(err); return; }
			records.forEach(function(record) {
				console.log('Retrieved', record.get('Name'));
				return record.getId();
			});
		});
	}

	// convert string `false` or `true` to boolean.
	var toBool = (bool) => { return (bool == 'true'); }

	if(action === 'add') {

		if(!name || !cat) {

			if(name) text = "*Category* is required. Data wasn\'t posted. Type `Help` for help.";

			if(cat) text = "Task *Name* is required. Data wasn\'t posted. Type `Help` for help.";
		} else {

			var task = {"Name": name, "Categories": [categories[cat]] };

			nextAction = toBool(nextAction); 

			task = _.assign({}, task, {"Next Actions": nextAction});

			if (date){ task = _.assign({}, task, {"Created Date": date}); } 

			base('Tasks').create(task, function(err, record) {
				if (err) { console.error(err); return; }
				
				//text = JSON.stringify(record); 
				text = 'Added "' + record.get('Name') + '" to `' + record.get('Categories') + '`.';
			});
		}


	} else if(action === 'done' || action === 'Done' || action === 'complete' || action === 'Complete') {

		var handler = _.toUpper(_.last(_.split(message.text, " ")));
		var id = _.last(_.split(message.text, " "));
		//var id = getRecord(handler);

		base('Tasks').update(id, {
			"Completed": true
		}, function(err, record) {
		
			if (err) { console.error(err); return; }

			text = `"` + record.get('Name') + `" marked as Complete.`;
		});

	} else if(action === 'delete' || action === 'Delete' || action === 'del' || action === 'Del') {

		var id = _.last(_.split(message.text, " "));

		base('Tasks').destroy(id, function(err, deletedRecord) {
			if (err) { console.error(err); return; }

			text = 'Record was Deleted'; // deletedRecord.id;
		});

	} else {

		base('Tasks').select({
			view: categories[action]
		}).firstPage(function(err, records) {

			if (err) { console.error(err); text = 'there was an error: ' + err; }

			var count = 1;
			_.each(records, (record) => {
				// distiguish between `nextactions` and the other list
				if(message.text === "nextactions"){
					text += count + ' *' + record.get('Handler') + '*: ' + record.get('Name') + ' `' + record.get('Categories') + '`\n'; 
				} else {
					if(record.get('Next Actions')){ // add `Next Actions` if task is tagged.
						text += count + ' ' + record.getId() + ': ' + record.get('Name') + ' `Next Actions`' + '\n';
					} else {
						text += count + ' ' + record.getId() + ': ' + record.get('Name') + '\n';
					}
				}
				count++;
			});
		});
	}


	return promiseDelay(seconds * 1000).then(() => {

		return slackDelayedReply(message, {
			text: text,
			response_type: 'in_channel'
		});
	}).then(() => false);

});


module.exports = api;