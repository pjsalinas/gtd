const request = require('request');

const slack = {
  pronto (values) {
    const {msg, res} = values;
    res.status(201).json({
      response_type: 'ephemeral',
      text: msg,
    });
  },

  delayed(values) {
    const {msg, url} = values;
    request({
      method: 'POST',
      uri: url,
      body: {
        response_type: 'ephemeral',
        text: msg,
      },
      json: true,
    });
  },

  error(values) {
    const {err, url} = values;
    console.log('error ==>', values);
    let msg = `err: ${err.error}\n msg: ${err.message}`;
    this.delayed(msg, url);
  },

  help () {
    let resp = 'Hey, "*/gtd*" helps you to manage your tasks and projects in an Airtable Base.\n' +
        '• To add a new task: `/gtd add Task-Name, Category, true|false, yyyy-mm-dd, yyyy-mm-dd, project`\n' +
        '• List "Next Actions" tasks: `/gtd nextactions`\n' +
        '• List "At Home" tasks: `/gtd athome`\n' +
        '• List "At Work" tasks: `/gtd atwork`\n' +
        '• List "To Call" tasks: `/gtd tocall`\n' +
        '• List "Waiting For" tasks: `/gtd waitingfor`\n' +
        '• List "Someday" tasks: `/gtd someday`\n' +
        '• List "Active Projects": `/gtd projects`\n' +
        '• List "Shore Lists": `/gtd lists`\n' +
        '• To mark a task as "Complete": `/gtd done "handler"`\n' +
        '• To "Delete" a task: `/gtd delete "handler"`\n' +
        '• To "Update a task: `/gtd update "handler", name stringValue, start yyyy-mm-dd, due yyyy-mm-dd, next true|false, done true|false`\n' +
        '• To mark a project as "Complete": `/gtd done "handler" project`\n' +
        '• To "Delete" a project: `/gtd done "handler" project`\n' +
        '• To add a new project: `/gtd add "Project Name", "category = project", "date" [,yyyy-mm-dd], "belongTo" [, project handler]`\n' +
        '• To "Load a list of shores": `/gtd load "handler"`\n' +
        '• To "Send a list of shores": `/gtd send "handler" "receiver"`\n' +
        '• To "Display a list of shores": `/gtd display "handler"`';
    return resp;
  }
};

module.exports = slack;
