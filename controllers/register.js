const handleRegister = (req, res, db, bcrypt) => {
	const { name, email, password } = req.body;

	if (!email || !name || !password) {
		return res.status(400).json('Incorrect form submission');
	}

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
	}).catch((err) => res.status(400).json(err));
};

module.exports = {
	handleRegister: handleRegister,
};
