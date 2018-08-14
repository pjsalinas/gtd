const _ = require('lodash');

// to parcer the string request from the user.
exports.parcer = (text) => {
  
  let string_values = {};

  // Possible text
  // => add task-name, category, nextaction, date, date
  let split_text = _.split(text, ",");

  // => ["add task-name", "category", "nextaction", "date", "date"]
  let action = _.first(_.split(split_text[0], " "));
  string_values.action = action;

  let name = _.join(_.drop(_.split(split_text[0], " ")), " ");
  string_values.name = name;

  let category = split_text[1];
  string_values.category = _.trim(_.toLower(category));

  let nextaction = split_text[2];
  string_values.nextaction = _.trim(nextaction);

  let start = _.trim(split_text[3]);
  string_values.start = start;

  let due = _.trim(split_text[4]);
  string_values.due = due;

  return string_values;
};
