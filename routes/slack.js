const express = require('express');
const router = express.Router();

const slack = require('../helpers/slack');
const response = require('../helpers/responses');
const isValid = require('../helpers/isValid');
const Tasks = require('../controllers/tasks');

router.get('/slack', function (req, res) {
  res.send('this is the slack page description');
  console.log('this is the slakc page description');
});

router.post('/slack', function (req, res) {
  // get the "token" send by slack
  // get the "user_id" to propely insert records
  // Slack gives us a "response URL" that we can use to post back to
  // the channel after our initial response, so let's pull that out.
  // Pull the string "text" out from the request.
  let {token, user_id, response_url, text} = req.body;
  
  // Check that the request is coming from Slack
  //token = req.body.token;
  if(token != process.env.SLACK_VERIFICATION_TOKEN){
    res.status(403).send('Forbiden');
    return;
  }

  // Split the text, and assign the correspondent values
  let fields = slack.parcer(text);
  
  let action = fields.action;
  let actionIsValid = true;

  // Check `action` is a valid action
  let {valid_action, bool} = isValid.action(action);
  if (bool) {
    fields.action = valid_action;
  } else {
    actionIsValid = false;
  }


  // Check the requested action is include in `views`
  if (actionIsValid) {

    if (fields.action === 'Help') {
      // send the response to the user 'pronto'
      let respText = response.help();
      response.pronto({msg: respText, res: res});
    } else {
      // send the response to the user 'PRONTO' <= 3000 ms.
      let respText = `*${fields.action}*`;
      response.pronto({msg: respText, res: res});

      // Evalute the rest of the remaining possible actions.
      switch (fields.action) {
          
        case 'Add':
          // data => {name: name, category: category, nextaction: true|false, start_date: date, due_date: date}
          let data = isValid.data(fields);
          if (data.isValid) {
            let respText = 'There was an issue with your data. Check and comeback';
            response.delayed({msg: respText, url: response_url});
          } else {
            // You only can add records to your account.
            // Later, you might be able to invite more users
            data.user_id = [process.env.AIRTABLE_MAIN_USER];
            Tasks.create({fields: data, url: response_url});
          }
          break;
          
        case 'Delete': // => /gtd delete XXXX
          Tasks.filterByFormula({handler: fields.name, next_action: fields.action, url: response_url});
          break;
          
        case 'Done': // => /gtd done XXXX
          Tasks.filterByFormula({handler: fields.name, next_action: fields.action, url: response_url});
          break;
          
        case 'Update': // => /gtd update XXXX, category newcategory, nextaction newboolean, start newdate, due newdate
          let fields_toCheck = isValid.prepare_fields_toUpdate(fields);
          if (!fields_toCheck.isValid) {
            response.delayed({msg: 'There was an issue with your values', url: response_url});
          } else {
            delete fields_toCheck.isValid;
            Tasks.filterByFormula({handler: fields.name, next_action: fields.action , url: response_url, toUpdate: fields_toCheck});
          }
          break;
          
        case 'Record Information': // => /gtd show XXXX
          Tasks.filterByFormula({handler: fields.name, next_action: fields.action, url: response_url});
          break;
          
          // Check if the value is within the following values:
          // ['Next Actions', 'At Home', 'At Work', 'To Call', 'Waiting For', ...]
        default:
        //case (_.includes(category_values, view)? view : false):
          Tasks.lists({view: fields.action, url: response_url});
          break;
      } // end-switch => (view)
    }


  } else {
    // the action was not include in `views`
    let respText = 'WoW, I missed that. Some of valid commands: `add`, `nextactions`, `athome`, `atwork`. For more commands use `help`';
    response.pronto({msg: respText, res: res});
  } // else-if => (isValid)

});

module.exports = router;
