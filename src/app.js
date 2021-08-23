import express from 'express'

const app = express()
const port = 3000

app.use(express.static(__dirname + '/public'))

app.get('/', (_req, res) => {
  res.sendFile(__dirname + '/public/views/index.html')
})

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`)
})
