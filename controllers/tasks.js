let _ = require('lodash');

let Tasks = require('../models/tasks');
let response = require('../helpers/responses');
let utils = require('../helpers/utils');


// Display all list of Tasks
exports.lists = (values) => {
  const {view, url} = values;
  // Query the database.
  Tasks.select({view: view})
    .then((records) => {
      let respText = utils.list_records(records);
      response.delayed({msg: respText, url: url});
    }, (err) => {
      response.delayed({err: err, url: url});
    });
};

exports.create = (values) => {
  const {fields, url} = values;
  Tasks.create({fields: fields})
    .then((record) => {
      let respText = utils.retrieve_record(record);
      response.delayed({msg: respText, url: url});
    }, (err) => {
      response.delayed({err: err, url: url});   
    });
};

exports.filterByFormula = (values) => {
  const {handler, next_action, url} = values;
  
  let filterByFormula = `{handler} = "${_.toUpper(handler)}"`;
  
  function check_categories () {
    let isValid = true;
  };
  
  function check_value () {
    let isValid = true;
  }
  
  /*
  if (values.toUpdate ) {
    
    if (values.toUpdate.category) {
      let category = _.first(_.split(values.toUpdate.category, " "));
      console.log('category ==>', category);
    }
    if (values.toUpdate.nextaction) {
      console.log(values.toUpdate.nextaction);
    }
    if (values.toUpdate.start) {
      console.log(values.toUpdate.start);
    }
    if (values.toUpdate.due) {
      console.log(values.toUpdate.due);
    }
  }
  */
  
  Tasks.filterByFormula({filterByFormula: filterByFormula})
    .then((records) => {
      if (records.length < 1) {
        let respText = `Record \`${_.toUpper(handler)}\` was not found`;
        response.delayed({msg: respText, url: url});
      } else {
        let recId = records[0].getId();
        
        // next goes here !!!
        switch (next_action) {
            
          case 'Delete':
            let record_name = records[0].get('name');
            Tasks.destroy({id: recId})
              .then((deleted_record) => {
                //let respText = utils.retrieve_record(deleted_record);
                let respText = `Record _*${record_name}*_ was deleted from your Task List`;
                response.delayed({msg: respText, url: url});
              }, (err) => {
                response.delayed({err: err, url: url});               
              });
            break;
            
          case 'Done':
            let nameRecordCompleted = records[0].get('name');
            Tasks.update({id: recId, data: {task_completed: true}})
              .then((updated_record) => {
                if (updated_record) {
                  let respText = `Record _*${nameRecordCompleted}*_ was marked as completed`;
                  response.delayed({msg: respText, url: url});
                } else {
                  let respText = `Could not find any task with handler ${_.toUpper(handler)}`;
                  response.delayed({msg: respText, url: url});
                }
              }, (err) => {
                response.delayed({err: err, url: url});              
              });
            break;
            
          case 'Update':
            // => update XXXX, category new-category, nextaction true|false, start new-star-date, due new-due-date
            Tasks.update({id: recId, data: values.toUpdate, url: url})
              .then((record) => {
                if (record) {
                  let respText = utils.retrieve_record(record);
                  response.delayed({msg: respText, url: url});
                } else {
                  let respText = 'Not record were updated';
                  response.delayed({msg: respText, url: url});
                }
              }, (err) => {
                response.delayed({err: err, url: url});   
              });
            break;
            
          case 'Record Information':
            Tasks.retrieve({id: recId})
              .then((record) => {
                if (record) {
                  let respText = utils.retrieve_record(record);
                  response.delayed({msg: respText, url: url}); 
                } else {
                  let respText = 'Not records found';
                  response.delayed({msg: respText, url: url});
                }           
              }, (err) => {
                response.delayed({err: err, url: url});            
              });
            break;
        }
      }
    }, (err) => {
      response.delayed({err: err, url: url});  
    });
};
