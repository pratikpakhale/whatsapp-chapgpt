// express server listening post req on /webhook and print body

const express = require('express')

const serverless = require('serverless-http')
require('dotenv').config()

const { MessagingResponse } = require('twilio').twiml

const { Configuration, OpenAIApi } = require('openai')

const configuration = new Configuration({
  apiKey: process.env.OPENAI,
})

const openai = new OpenAIApi(configuration)

const history = []

const app = express()

app.use(express.urlencoded({ extended: false }))

app.post('/webhook', async (req, res) => {
  const message = req.body.Body

  console.log(message)

  const messages = []
  for (const [input_text, completion_text] of history) {
    messages.push({ role: 'user', content: input_text })
    messages.push({ role: 'assistant', content: completion_text })
  }
  messages.push({ role: 'user', content: message })

  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: messages,
  })

  const completion_text = completion.data.choices[0].message.content
  console.log(completion_text)

  const twiml = new MessagingResponse()

  twiml.message(completion_text)

  history.push([message, completion_text])

  res.type('text/xml').send(twiml.toString())
})

if (process.env.NODE_ENV === 'production') {
  // app.listen(port)
  module.exports.handler = serverless(app)
} else {
  app.listen(5000, () => {
    console.log('listening on port 5000')
  })
}
