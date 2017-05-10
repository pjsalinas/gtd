# Claudia-Bot-Builder

Using claudia-bot-builder module to create a Slack Slash Command and AWS that can talk to third party APIs.

```npm init```

```npm install claudia-bot-builder -S
npm insatll 'other-dependencies' -S```

# CREATE A NEW LAMBDA FUNCTION TO BE USED WITH THE SLACK SLASH COMMAND.
# HAVE THE SLASH COMMAND token ready
```claudia create \
--api-module bot \
--region us-east-1 \
--timeout 120 \
--allow-recursion 
--configure-slack-slash-command```




# TO SET STAGEVARIABLES, THEN GET USING request.env.VARIABLE_NAME
```aws apigateway create-deployment \
--rest-api-id <this is the claudia id from the claudia.json file> \
--variables VARIABLE_NAME=variable_value,ANOTHER_VARIABLE_NAME=another_variable_value \
--stage-name 'latest' \
--stage-description 'lastest version' \
--description 'To connect to Airtable Bases'```

# TO SET PROCESS VARIABLES, THEN GET THEM USING process.env.VARIABLE_NAME
```claudia update --set-env VARIABLE_NAME=variable_value,ANOTHER_VARIABLE_NAME=another_variable_value```

# FUNCTION NAME
```ssc```

```claudia create --region us-east-1```