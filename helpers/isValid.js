let _ = require('lodash');

// Obj - Holds all possible commands for the app.
let commands = require('./commands');

// check string action is a valid action.
exports.action = (action) => {
  let isValid = true;
  let keys = _.keys(commands.values);
  // action => Add, Next Actions, At Home.
  if (_.includes(keys, action)) {
    action = commands.values[action];
  } else {
    isValid = false;
  }
  return {valid_action: action, bool: isValid};
};

// check string category is a valid category.
let check_category = (category) => {
  let isValid = true;
  let keys = _.keys(commands.values);

  if (_.includes(keys, category)) {
    isValid = commands.values[category];
  } else {
    isValid = false;
  }
  
  return isValid;
};

// let 'transform' a string value to a boolean value
exports.toBool  = (bool) => (bool == 'true');

let check_nextaction = (bool) => (bool == 'true');

// check string date (2018-8-10) is a valid date.
exports.date = (date) => {
  return date;
}

exports.isActionInViews = (action) => {
  let categories = _.keys(commands.categories);
  let actions = _.keys(commands.actions);
  let views = categories.concat(actions);

  let action_values = _.uniq(_.valuesIn(commands.actions));
  let category_values = _.uniq(_.valuesIn(commands.categories));

  if (_.includes(action_values, action)) {
    return true;
  } else {
    return false;
  }
}

exports.data = (fields) => {
  let isValid = true;
  let wrongCategory = '';
  let checked_data = {};
  
  // check category
  let checked_category = check_category(fields.category);
  if (checked_category) {
    checked_data.category = checked_category;
  } else {
    checked_data.isValid = false;
    checked_data.wrongCategory = fields.category;
  }
  
  // check next action
  let checked_nextaction = check_nextaction(fields.nextaction) || false;
  checked_data.nextaction = checked_nextaction;
  
   // check dates
  if (fields.start) checked_data.start_date = fields.start;
  if (fields.due) checked_data.due = fields.due;

  checked_data.name = fields.name;
 
  return checked_data;

};

exports.prepare_fields_toUpdate = (fields) => {
  /* in object
  fields = {
    category: "name new-name",
    nextaction: "category `work`",
    start: "nextaction true",
    due: "start 20180-8-13"
  };
  */
  
  let respObj = {}; // "name" || "category" || nextaction || "start_date" || "due_date"
  respObj.isValid = true;
  
  // fields is not restricted to a particular value like the "Add" string.
  if (fields.category) {// this is the first field on the string query requested
    let temp = check_field_value(split_field_string(fields.category));
    let keys = _.keys(temp);
    
    if (temp) {
      respObj[keys[0]] = temp[keys[0]];
    } else {
      respObj.isValid = false;
    }
  }
  
  if (fields.nextaction) {
    let temp = check_field_value(split_field_string(fields.nextaction));
    let keys = _.keys(temp);
    
    if(temp) {
      respObj[keys[0]] = temp[keys[0]];
    } else {
      respObj.isValid = false;
    }
  }
  
  if (fields.start) {
    let temp = check_field_value(split_field_string(fields.start));
    let keys = _.keys(temp);
    
    if(temp) {
      respObj[keys[0]] = temp[keys[0]];
    } else {
      respObj.isValid = false;
    }
  }
  
  if (fields.due) {
    let temp = check_field_value(split_field_string(fields.due));
    let keys = _.keys(temp);
    
    if(temp) {
      respObj[keys[0]] = temp[keys[0]];
    } else {
      respObj.isValid = false;
    }
  }
  
  return respObj;
  
  /* out object
  {
    name: "new name",
    category: "new category",
    nextaction: "true\false",
    start_date: "new date",
    due_date: "new date"
  };
  */
};

let split_field_string = (str) => {
  // 'name "Foo Bar"' => field = name, val = "Foo Bar"
  let field = _.toLower(_.trim(_.first(_.split(str, " "))));
  console.log('field ==>', field);
  
  let val = _.trim(_.join(_.drop(_.split(str, " ")), " "));
  console.log('value ==>', val);
  
  return {field: field, val: val};
};

let check_field_value = (field) => {
  // check that fields belong to: 'category', 'nextaction', 'start', 'due'  
  let respObj = {};
  
  switch (field.field) {
      
    case 'category':
      let category = check_category(field.val);
      if (category) {
        respObj[field.field] = category;
      }
      break;
        
    case 'next':
    case 'nextaction':
    case 'nextactions':
      respObj.nextaction = exports.toBool(field.val);
      break;
      
    case 'start':
      respObj.start_date = field.val;
      break;
      
    case 'due':
      respObj.due_date = field.val;
      break;
      
    default:
      respObj[field.field] = field.val;
      break;
  }

  return respObj;
};


// Get today's date. Date needs format: yyyy-mm-dd
exports.getTodaysDate = function (dt) {
  if(!dt) dt = new Date();
  let yyyy = dt.getFullYear();
  let mm = dt.getMonth() + 1;
  let dd = dt.getDate();

  return `${yyyy}-${mm}-${dd}`;
};
