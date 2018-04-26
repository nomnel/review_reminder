'use strict';

const config = require('./config.json');
const fetch = require('node-fetch');

const query = `
query {
  repository(owner: "${config.github.owner}", name: "${config.github.name}") {
    pullRequests(last: 50, labels: ["${config.github.labels.join('","')}"], states: OPEN) {
      nodes {
        id
        title
        url
      }
    }
  }
}`;

const buildText = nodes => {
  let lines = nodes.map(x => [x.title, x.url, ''].join("\n"));
  if (config.slack.title) { lines.unshift(config.slack.title) }
  return lines.join("\n");
}

const postToSlack = text => {
  const payload = {
    text: text,
    channel: config.slack.channel,
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
  return fetch('https://api.github.com/graphql', {
    method: 'POST',
    body: JSON.stringify({query}),
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
