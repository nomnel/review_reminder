# review_reminder
a function for Google Cloud Functions to post pull request URLs to Slack

## setup

```sh
cp config.json.example config.json
```

and edit `config.json`.

## deploy

```sh
gcloud beta functions deploy {your_function_name} \
  --source={path_to_this_repository} \
  --trigger-http
```