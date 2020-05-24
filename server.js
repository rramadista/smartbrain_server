const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const db = knex({
	client: 'pg',
	connection: {
		host: '127.0.0.1',
		user: 'postgres',
		password: 'Kimora1205',
		database: 'smartbrain',
	},
});

const app = express();

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
	res.send(database.users);
});

app.post('/signin', (req, res) => {
	db.select('email', 'hash')
		.from('login')
		.where('email', '=', req.body.email)
		.then(async (data) => {
			const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
			if (isValid) {
				try {
					const user = await db
						.select('*')
						.from('users')
						.where('email', '=', req.body.email);
					res.json(user[0]);
				} catch (err) {
					return res.status(400).json('Unable to get user');
				}
			} else {
				res.status(400).json('Wrong credentials');
			}
		})
		.catch((err) => res.status(400).json('Wrong credentials'));
});

app.post('/register', (req, res) => {
	const { name, email, password } = req.body;
	const hash = bcrypt.hashSync(password);

	db.transaction((trx) => {
		trx.insert({
			hash: hash,
			email: email,
		})
			.into('login')
			.returning('email')
			.then(async (loginEmail) => {
				const user = await trx('users').returning('*').insert({
					email: loginEmail[0],
					name: name,
					joined: new Date(),
				});
				res.json(user[0]);
			})
			.then(trx.commit)
			.then(trx.rollback);
	}).catch((err) => res.status(400).json('Unable to register'));
});

app.get('/profile/:id', (req, res) => {
	const { id } = req.params;

	db.select('*')
		.from('users')
		.where({ id: id })
		.then((user) => {
			if (user.length) {
				res.json(user[0]);
			} else {
				res.status(400).json('User not found');
			}
		})
		.catch((err) => res.status(400).json('Error getting user'));
});

app.put('/image', (req, res) => {
	const { id } = req.body;

	db('users')
		.where('id', '=', id)
		.increment('entries', 1)
		.returning('entries')
		.then((entries) => {
			res.json(entries[0]);
		})
		.catch((err) => res.status(400).json('Unable to get entries'));
});

app.listen(5000, () => {
	console.log('App is running on port 5000');
});
