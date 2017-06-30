/**
 * Getting Things Done (/gtd). A conextion between Slack Slash Command and Airtable.
 * version: 1.0
 * date:
 */

'use strict';

const promiseDelay = require('promise-delay');
const aws = require('aws-sdk');
const lambda = new aws.Lambda();
const botBuilder = require('claudia-bot-builder');
const slackDelayedReply = botBuilder.slackDelayedReply;

var Airtable = require('airtable');
const _ = require('lodash');

// json of the categories
let categories = {
	nextactions: 'Next Actions', next: 'Next Actions',
	athome: 'At Home', home: 'At Home',
	atwork: 'At Work', work: 'At Work',
	tocall: 'To Call', call: 'To Call', idea: 'Ideas',
	waitingfor: 'Waiting For', wait: 'Waiting For',
	errands: 'Errands', err: 'Errands',
	add: 'Add',
	help: 'Help', 
	complete: 'Done', done: 'Done',
	delete: 'Delete', del: 'Delete', Del: 'Delete', remove: 'Remove',
	shores: 'Shores',

	load: "Shores List",
	show: 'Show Something',
	list: "The Lists",
	projects: "List of Projects"
};

// this are the catetories
let views = _.keys(categories);

const api = botBuilder((message, apiRequest) => {

	const text = message.text;
	const action = _.first(_.split(text, " "));

	if(_.includes(views, action)) {
		
		if(_.toUpper(action) === 'HELP') {
			return 'Hey, "/gtd" help you to manage your Airtable tasks.\n' +
				'• List "Next Actions" tasks: `/gtd nextactions`\n' +
				'• List "At Home" tasks: `/gtd athome`\n' +
				'• List "At Work" tasks: `/gtd atwork`\n' +
				'• List "To Call" tasks: `/gtd tocall`\n' +
				'• List "Waiting For" tasks: `/gtd waitingfor`\n' +
				'• List "Active Projects": `/gtd projects`\n' +
				'• To mark a task as "Complete": `/gtd done "taskId`\n' +
				'• To "Delete" a task: `/gtd delete "taskId"`\n' +
				'• To add a new task `/gtd add "Task Name", "category", optional [true or false], optional [YYYY-MM-DD]`\n' +
				'• Load list: `/gtd load "list name" [daily, weekly, monthly, quarterly]`\n' +
				'• Doesn\'t work yet:\n' +
				'`/gtd add Remember The Milk, athome, 2017-05-25`\n' +
				'`/gtd move "handler" "category"`' +
				'`/gtd show "handler"`' +
				'`/gtd projects`\n' +
				'`/gtd list`';
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
				text: `*${view}*`,
				response_type: 'in_channel'
			}
		})
		.catch(() => {
			return `Could not setup timer :(`
		});
	} else {
		return 'Wow, I don\'t know that.\nValid commands: `nextactions`, `athome`, `atwork`, `tocall`, `waitingfor`, `add`, `delete`, `done`, `load`, and `help`.';
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

	// Read a record, using the handler 'XXXX' from the list:
	var getRecord = (handler) => {

		var filterByFormula = '{Handler} = "' + handler + '"'; 
		var Id = '';

		base('Tasks').select({
			view: 'Uncomplete',
			filterByFormula: filterByFormula
		}).firstPage(function(err, records) {
			if (err) { console.error(err); return; }
			records.forEach(function(record) {
				Id = record.getId();
			});
		});

		return Id;
	};

	var updateRecord = (id) => {
		base('Tasks').update(id, {
			"Completed": true
		}, function(err, record) {
			if (err) { console.error(err); return; }

			text = `Record "` + record.get('Name') + `" marked as Complete.`;
		});
	};

	var deleteRecord = (id, name) => {
		base('Tasks').destroy(id, (err, deletedRecord) => {
			if (err) { console.error(err); return; }

			text = `Record "${name}" was Deleted.`;
		});
	}

	var stringToDate = (str) => {
		return (new Date(str)).toString().split(' ').splice(1,3).join(' ');
	};

	var addRecord = (task) => {

		base('Tasks').create(task, (err, record) => {
			if(err) { console.error(err); return; }
		});
	};

	// convert string `false` or `true` to boolean.
	var toBool = (bool) => { return (bool == 'true'); };


	if(action === 'add') {

		if(!name || !cat) {

			if(name) text = "*Category* is required. Data wasn\'t posted. Type `Help` for help.";

			if(cat) text = "Task *Name* is required. Data wasn\'t posted. Type `Help` for help.";
		} else {

			var task = {"Name": name, "Categories": [categories[cat]] };
			nextAction = toBool(nextAction); 
			task = _.assign({}, task, {"Next Actions": nextAction});
			if (date){ task = _.assign({}, task, {"Created Date": date}); } 

			base('Tasks').create(task, (err, record) => {
				if(err) { console.error(err); return; }

				text = 'Added "' + record.get('Name') + '" to `' + record.get('Categories') + '`.';
			});
		}


	} else if(action === 'done' || action === 'Done' || action === 'complete' || action === 'Complete') {

		var handler = _.toUpper(_.last(_.split(message.text, " ")));
		var filterByFormula = '{Handler} = "' + handler + '"'; 

		base('Tasks').select({
			view: 'Uncomplete',
			filterByFormula: filterByFormula
		}).firstPage((err, records) => {
			if (err) { console.error(err); return; }

			var id = records[0].getId();
			updateRecord(id);
		});

	} else if(action === 'delete' || action === 'Delete' || action === 'del' || action === 'remove' || action === 'Del') {

		var handler = _.toUpper(_.last(_.split(message.text, " ")));
		var filterByFormula = '{Handler} = "' + handler + '"'; 

		base('Tasks').select({
			view: 'Uncomplete',
			filterByFormula: filterByFormula
		}).firstPage((err, records) => {
			if (err) { console.error(err); return; }

			var id = records[0].getId();
			var name = records[0].get('Name');
			deleteRecord(id, name);
		});


	} else if(action === 'show') {

		var handler = _.toUpper(_.last(_.split(message.text, " ")));
		var filterByFormula = '{Handler} = "' + handler + '"';

		base('Tasks').select({
			view: 'Uncomplete',
			filterByFormula: filterByFormula
		}).firstPage((err, records) => {
			if (err) { console.error(err); return; }

			var record = records[0];
			text = 'Name: ' + record.get('Name') + '\n' +
					'Category: ' + record.get('Categories') + '\n';
			if(record.get('Next Actions') !== undefined){
				text += 'Tagged `Next Action`' + '\n';
			}
			if(record.get('Created Date') !== undefined){
				text += 'Created: ' + stringToDate(record.get('Created Date'));
			}
					
		});

	} else 	{

		switch (true) {
			case action === "load":
				if(name === 'daily') {
					var filterByFormula = '{Type} = "Daily Shores"';
				} else if(name === 'weekly'){
					var filterByFormula = '{Type} = "Weekly Shores"';
				} else if(name === 'monthly') {
					var filterByFormula = '{Type} = "Weekly Shores"';
				} else if(name === 'quarterly') {
					var filterByFormula = '{Type} = "Quartely Shores"';
				}

				base('Lists').select({
					view: "Main View",
					filterByFormula: filterByFormula
				}).firstPage((err, records) => {
					if(err) { console.error(err); return; }

					_.each(records, (record) => {
						var task = {
							"Name": record.get("Name"),
							"Next Actions": true,
							"Categories": ["Shores"]
						}
						addRecord(task);
					});
					text = 'Your "' + _.capitalize(name) + '" Shores List was added!';
				})
				break;

			case action === 'projects':

				switch(true) {
					case name === "add":
						base('Projects').create({
							"Name": cat
						}, (err, record) => {
							if(err) { console.error(err); return; }

							text = 'Added "' + record.get("Name") + '" ';
						});
						break;

					default:
						base('Projects').select({
							view: 'Active'
						}).firstPage((err, records) => {
							if(err) { console.error(err); return; }

							_.each(records, (record) => {
								text += '• *' + record.get('Handler') + '* "' + record.get('Name') + '"\n';
							});				
						});
						break;
				}
				break;

			default:
				base('Tasks').select({
					view: categories[action]
				}).firstPage(function(err, records) {

					if (err) { console.error(err); text = 'there was an error: ' + err; }

					if(_.size(records) < 1){
						text = 'There are not records on this list.'
					} else {
						var count = 1;
						_.each(records, (record) => {
							// distiguish between `nextactions` and the other list
							if(!record.get("Complete")){
								if(message.text === "nextactions" || message.text === 'next'){
									text += count + ' *' + record.get('Handler') + '*: ' + record.get('Name') + ' `' + record.get('Categories') + '`\n'; 
								} else {
									if(record.get('Next Actions')){ // add `Next Actions` if task is tagged.
										text += count + ' ' + record.get('Handler') + ' "' + record.get('Name') + '" `Next Actions`' + '\n';
									} else {
										text += count + ' ' + record.get('Handler') + ' "' + record.get('Name') + '"\n';
									}
								}
								count++;
							}
						});
					}
				});
				break;
		}
	}

// next step for the script
action = _.toUpper(action);
switch(true){
	case action === "ADD":
		if(cat === "project") {
			// create a project entry
		} else {
			// create a task entry
		}
		break;
	case action === "DELETE" || action === "DEL":
		
		break;
	case action === "UPDATE":
		break;
	case action === "READ":
		break;

	default:
		break;
}

	return promiseDelay(seconds * 1000).then(() => {

		return slackDelayedReply(message, {
			text: text,
			response_type: 'in_channel'
		});
	}).then(() => false);

});


module.exports = api;