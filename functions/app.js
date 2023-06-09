// express server listening post req on /webhook

const express = require('express')

const serverless = require('serverless-http')
require('dotenv').config()

const { MessagingResponse } = require('twilio').twiml

const { Configuration, OpenAIApi } = require('openai')

const configuration = new Configuration({
  apiKey: process.env.OPENAI,
})

const openai = new OpenAIApi(configuration)

const history = {}

const app = express()

app.use(express.urlencoded({ extended: false }))

app.post('/*webhook', async (req, res) => {
  try {
    const message = req.body.Body

    if (message === 'clear') {
      history['WaId'] = []
      const twiml = new MessagingResponse()
      twiml.message('State Cleared Successfully')
      res.type('text/xml').send(twiml.toString())
    }

    // console.log(req.body)

    console.log('message: ' + message)

    const messages = []
    if (history['WaId']) {
      for (const [input_text, completion_text] of history['WaId']) {
        messages.push({ role: 'user', content: input_text })
        messages.push({ role: 'assistant', content: completion_text })
      }
    }
    messages.push({ role: 'user', content: message })

    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: messages,
    })

    const completion_text = completion.data.choices[0].message.content

    // if history['WaId'] is an array then push or else create an array and push
    history['WaId']
      ? history['WaId'].push([message, completion_text])
      : (history['WaId'] = [[message, completion_text]])

    console.log('openai response: ' + completion_text)

    const twiml = new MessagingResponse()
    twiml.message(completion_text)
    res.type('text/xml').send(twiml.toString())
  } catch (err) {
    console.log(err.message)
  }
})

if (process.env.NODE_ENV === 'production') {
  // app.listen(port)
  module.exports.handler = serverless(app)
} else {
  app.listen(5000, () => {
    console.log('listening on port 5000')
  })
}
