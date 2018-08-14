//require('dotenv').config();

const Airtable = require('airtable');
const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_GTD);

const Tasks = {

  // Add a new record to the 'Tasks' table.
  create (values) {
    const {fields} = values;
    return new Promise((resolve, reject) => {
      base('Tasks').create(fields, (err, record) => {
        if(err) {
          reject(err);
        } else {
          resolve(record);
        }
      });
    });
  },

  // Read records from the 'Tasks' table.
  select (values) {
    const {view} = values;
    return new Promise((resolve, reject) => {
      base('Tasks').select({
        view: view
      }).firstPage((err, records) => {
        if(err) {
          reject(err);
        } else {
          resolve(records);
        }
      });
    });
  },

  // Update a record from the 'Tasks' table.
  update (values) {
    const {id, data} = values;
    return new Promise((resolve, reject) => {
      base('Tasks').update(id, data, (err, record) => {
        if(err) {
          reject(err);
        } else {
          resolve(record);
        }
      });
    });
  },

  // Delete a record from the 'Tasks' table.
  destroy (values) {
    const {id} = values;
    return new Promise((resolve, reject) => {
      base('Tasks').destroy(id, (err, deletedRecord) => {
        if(err) {
          reject(err);
        } else {
          resolve(deletedRecord);
        }
      });
    });
  },

  // Find a record by its "Id"
  retrieve (values) {
    const {id} = values;
    return new Promise((resolve, reject) => {
      base('Tasks').find(id, (err, record) => {
        if (err) {
          reject(err);
        } else {
          resolve(record);
        }
      });
    });
  },

  // Get record or records by {Handler} = "XXXX"
  filterByFormula (values) {
    const {filterByFormula} = values;
    return new Promise((resolve, reject) => {
      base('Tasks').select({
        view: 'Main View',
        filterByFormula: filterByFormula
      }).firstPage((err, records) => {
        if(err) {
          reject(err);
        } else {
          resolve(records);
        }
      });
    });
  },
};

module.exports = Tasks;
