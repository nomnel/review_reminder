'use strict';

const config = require('./config.json');
const fetch = require('node-fetch');

const buildText = nodes => {
  let lines = nodes.map(x => [x.title, x.url, ''].join("\n"));
  if (config.slack.title) { lines.unshift(config.slack.title) }
  return lines.join("\n");
}

const buildQuery = repository => {
  return `
    query {
      repository(owner: "${repository.owner}", name: "${repository.name}") {
        pullRequests(last: 50, labels: ["${repository.labels.join('","')}"], states: OPEN) {
          nodes {
            id
            title
            url
          }
        }
      }
    }`;
}

const postToSlack = text => {
  const payload = {
    text: text,
    channel: config.slack.channel,
    username: config.slack.username,
    icon_emoji: config.slack.iconEmoji,
  };

  fetch(config.slack.webhookUrl, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then(res => {
    console.log('success');
  }).catch(err => {
    console.log('error:');
    console.log(err);
  })
}

exports.function = (req, res) => {
  for (let repository of config.github.repositories) {
    fetch('https://api.github.com/graphql', {
      method: 'POST',
      body: JSON.stringify({query: buildQuery(repository)}),
      headers: {
        'Authorization': `Bearer ${config.github.accessToken}`,
      },
    }).then(res => {
      return res.text();
    }).then(body => {
      const nodes = JSON.parse(body).data.repository.pullRequests.nodes;
      if (nodes.length === 0) { return }
      const text = buildText(nodes);
      postToSlack(text);
      res.send('ok');
    }).catch(err => {
      console.log('ERROR:', err);
      res.send(err);
    });
  }
}
