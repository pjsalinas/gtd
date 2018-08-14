const _ = require('lodash');

// To prepare a list of: HANDLER Record-Name entries
exports.list_records = (records) => {
  let respText = '';
  records.map((rec) => {
    let recId = _.toUpper((rec.getId()).substring(3, 7));
    respText += `\`${recId}\` ${rec.get('name')}\n`;
  });
  console.log(respText);
  return respText;
}

// To prepare the record information to be displayed.
exports.retrieve_record = (record) => {
  console.log(record);
  let respText = '>>>';
  let recId = _.toUpper((record.getId()).substring(3, 7));
  let name = record.get('name');
  let category = record.get('category');
  let nextaction = (record.get('nextaction'))? 'Yes' : 'No';
  let start = record.get('start_date') || 'Open';
  let due = record.get('due_date') || 'Open';
  let users = record.get('user_id');
  
  if (users.length > 1) {
    users = users.map((user) => {
      if (user === process.env.AIRTABLE_MAIN_USER) {
        return 'Pedro';
      } else {
        return _.toUpper(user.substring(3, 7));
      }
    });
  } else {
    users = 'Pedro';
  }
  let project = 'To be assigned';
  
  respText = `>>>Record \`${recId}\`\n Name: _*${name}*_\n Category: _*${category}*_\n Next Action: _*${nextaction}*_\n Start: _*${start}*_\n Due: _*${due}*_\n Users: _*${users}*_\n Project: _*${project}*_`;
  return respText;
};