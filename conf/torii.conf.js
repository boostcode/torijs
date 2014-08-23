var torii = {
	conf : {
		db : {
			host: '127.0.0.1:27017',
			data: 'torii_data_db',
			user: 'torii_user_db'
		},
		core : {
			title: 'Torii.js',
			welcomeTitle: 'Hint & Tips',
			welcomeMessage: 'Welcome to Torii.js Admin dashboard!',
			welcomeSubtitle: 'Use sidebar fields in order to manage your infrastructure.',
			port: 3900,
			allowPublicUserRegistration: true,
			allowSendEmailAction: true,
			allowSendPushAction: true
		},
		apns: {
			keyFile: "key.pem",
			certFile: "cert.pem",
			debug: true
		},
		gcm: {
			keyPass: 'abc'
		},
		mail: {
			host: '',
			port: 25,
			secureConnection: true,
			user: '',
			pass: '',
			from: ''
		}
	}
};

exports.torii = torii;
