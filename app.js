const express = require('express')
const path = require('path')
const logger = require('morgan')
const bodyParser = require('body-parser')
const { ppid, title } = require('process')
const neo4j = require('neo4j-driver')

const app = express()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'neo4j'))
const session = driver.session()

app.get('/', function (req, res) {
    session
        .run('MATCH(n: Movie) RETURN n')
        .then(function (result) {
            const movieArr = []
            result.records.forEach(function (record) {
                movieArr.push({
                    id: record._fields[0].identity.low,
                    title: record._fields[0].properties.title,
                    year: record._fields[0].properties.year
                })
            })

            session
                .run('MATCH(n: Person) RETURN n')
                .then(function (result) {
                    const personArr = []
                    result.records.forEach(function (record) {
                        personArr.push({
                            id: record._fields[0].identity.low,
                            name: record._fields[0].properties.name,
                            born: record._fields[0].properties.born
                        })
                    })
                    res.render('index', {
                        movies: movieArr,
                        persons: personArr
                    })
                })
        })
        .catch(function (err) {
            console.log(err)
        })
})

app.post('/movie/add', function (req, res) {
    const title = req.body.title
    const year = req.body.year

    session
        .run(`CREATE(n:Movie { title: '${title}', year: '${year}'}) RETURN n.title`)
        .then(function (result) {
            res.redirect('/')
        })
        .catch(function (err) {
            console.log(err)
        })
})

app.post('/person/add', function (req, res) {
    const name = req.body.name
    const born = req.body.born

    session
        .run(`CREATE(n:Person { name: '${name}', born: '${born}'}) RETURN n.name`)
        .then(function (result) {
            res.redirect('/')
        })
        .catch(function (err) {
            console.log(err)
        })
})

app.post('/movie/person/add', function (req, res) {
    const title = req.body.title
    const name = req.body.name

    session
        .run(`MATCH(p: Person { name: '${name}'}), (m: Movie {title: '${title}'}) MERGE(p)-[r:ACTED_IN]-(m) RETURN p,m`)
        .then(function (result) {
            res.redirect('/')
        })
        .catch(function (err) {
            console.log(err)
        })
})

app.post('/movie/rename', function (req, res) {
    const title = req.body.title
    const newTitle = req.body.newTitle

    session
        .run(`MATCH (m:Movie) WHERE m.title='${title}' SET m.title='${newTitle}'`)
        .then(function (result) {
            res.redirect('/')
        })
        .catch(function (err) {
            console.log(err)
        })
})

app.post('/person/rename', function (req, res) {
    const name = req.body.name
    const newName = req.body.newName

    session
        .run(`MATCH (per:Person) WHERE per.name='${name}' SET per.name= '${newName}'`)
        .then(function (result) {
            res.redirect('/')
        })
        .catch(function (err) {
            console.log(err)
        })
})

app.post('/movie/person/create', function (req, res) {
    const name = req.body.name
    const title = req.body.title
    const yearPerfomance = req.body.yearPerfomance

    session
        .run(`CREATE (per:Person {name: '${name}'})-[:ACTED_IN {year: ${yearPerfomance}}]-> (mov:Movie {title: '${title}'}) return per, mov`)
        .then(function (result) {
            res.redirect('/')
        })
        .catch(function (err) {
            console.log(err)
        })
})

app.post('/movie/person/list', function (req, res) {
    const name = req.body.name

    session
        .run(`MATCH (per: Person {name: '${name}'})-[:ACTED_IN]-> (mov: Movie) return mov.title`)
        .then(function (result) {
            console.log("----- Movies -----")
            result.records.forEach(function (record) {
                console.log(record._fields[0])
            })
            res.redirect('/')
        }).catch(function (err) {
            console.log(err)
        })
})

app.listen(3000)

console.log('Server started on Port 3000')

module.exports = app