
var CT = require('./modules/state-list');
var RT = require('./modules/role-list');
var AM = require('./modules/account-manager');
var EM = require('./modules/email-dispatcher');
//var AVM = require('./modules/availability-manager');



module.exports = function(app) {

// main login page //

	app.get('/', function(req, res){
	// check if the user's credentials are saved in a cookie //
		if (req.cookies.user == undefined || req.cookies.pass == undefined){
			res.render('login2', { title: 'Hello - Please Login To Your Account' });
		}	else{
	// attempt automatic login //
			AM.autoLogin(req.cookies.user, req.cookies.pass, function(o){
				if (o != null){
				    req.session.user = o;
					res.redirect('/home');
				}	else{
					res.render('login2', { title: 'Hello - Please Login To Your Account' });
				}
			});
		}
	});
	
	app.post('/', function(req, res){
		AM.manualLogin(req.param('user'), req.param('pass'), function(e, o){
			if (!o){
				res.send(e, 400);
			}	else{
			    req.session.user = o;
				if (req.param('remember-me') == 'true'){
					res.cookie('user', o.user, { maxAge: 900000 });
					res.cookie('pass', o.pass, { maxAge: 900000 });
				}
				res.send(o, 200);
			}
		});
	});
	
// logged-in user homepage //
	
	app.get('/home', function(req, res) {
	    if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    }   else{
	    	var session_variable = req.session.user;

	    	AM.getAccountByUserName(session_variable.user, function(o){

	    		if (o.role === 'Admin') {
					res.render('home-admin', {
						udata : req.session.user
					});
				}
				else if (o.role === 'Doctor') {
					res.render('home-DOC', {
						udata : req.session.user
					});
				}
				else {
					res.render('home-NH', {
						udata : req.session.user
					});
				}
			});
	    }
	});
	
	app.post('/home', function(req, res){
		if (req.param('user') != undefined) {
			AM.updateAccount({
				user 		: req.param('user'),
				name 		: req.param('name'),
				email 		: req.param('email'),
				state 		: req.param('state'),
				pass		: req.param('pass')
			}, function(e, o){
				if (e){
					res.send('error-updating-account', 400);
				}	else{
					req.session.user = o;
			// update the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });	
					}
					res.send('ok', 200);
				}
			});
		}	else if (req.param('logout') == 'true'){
			res.clearCookie('user');
			res.clearCookie('pass');
			req.session.destroy(function(e){ res.send('ok', 200); });
		}
	});

	app.get('/booking', function(req,res) {
		if (req.session.user == null) {
			res.redirect('/');
		}	else{
					res.render('bookevisit', {
						udata : req.session.user
					});

		}

	});

	app.post('/booking', function(req,res) {
		if (req.session.user == null) {
			res.redirect('/');
		} else if (req.param('rangestartdate') != null && req.param('rangeenddate') != null){
			var session_variable = req.session.user;
		//	console.log(req.param('rangestartdate'));
			AM.validateAndAddNewEVisit({
				user 	: session_variable.user,
				patient1name : req.param('patient1name'),
				patient1dob : req.param('patient1dob'),
				patient2name : req.param('patient2name'),
				patient2dob : req.param('patient2dob'),
				patient3name : req.param('patient3name'),
				patient3dob : req.param('patient3dob'),
				patient4name : req.param('patient4name'),
				patient4dob : req.param('patient4dob'),
				rangestartdate : req.param('rangestartdate'),
				rangeenddate	: req.param('rangeenddate'),
				nursename	: req.param('nursename')
			}, function(e, o) {

				if ( o == null)
					console.log("return value is null");
				if (o) {
					var session_variable = req.session.user;
					session_variable.doctoruser = o.doctoruser;
					session_variable.patient1name = o.patient1name;
					session_variable.patient2name = o.patient2name;
					session_variable.patient3name = o.patient3name;
					session_variable.patient4name = o.patient4name;
					session_variable.apoointmentdate = o.freedate;
					session_variable.appointmentstart = o.starttime;
					session_variable.appointmentend = o.endtime;
					session_variable.doctorname = o.doctorname;
					session_variable.doctorphoto = o.doctorphoto;
					res.send('ok', 200);

				} else {
						/*if ("03012015" >= toString(req.param('rangestartdate')))
							console.log("test is gte");
						else
							console.log("test is lt" + req.param('rangestartdate'));*/
						res.send('no-such-account', 400);	
				}
			});

		}
	});

	app.get('/booking-failure', function(req, res){
		if (req.session.user == null){
			res.redirect('/');
		}
		else{
			res.render('booking-failure', {
				udata:req.session.user
			});
		}
	});

	app.get('/booking-success', function(req, res){
		if (req.session.user == null)
			res.redirect('/');
		else{
			res.render('booking-success', {
				udata:req.session.user
			})
		}

	});

	app.get('/availability', function(req, res) {
	    if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
	        res.redirect('/');
	    }   else{
					res.render('availability', {
						udata : req.session.user
					});
				}
	});
	

	app.post('/availability', function(req,res) {
		if (req.session.user == null){
			res.redirect('/');
		}	else if (req.param('action') === 'enter to db') {
			//submitted a new task
			var session_variable = req.session.user;
			AM.addNewAvailability({
				user      : session_variable.user,
				freedate  : req.param('freedate'),
				starttime : req.param('starttime'),
				endtime	  : req.param('endtime')
			}, function(e) {
				if (e) {
					res.send(e, 400);
				} else{
					res.send('ok', 200);
				}
			});
		} else if (req.param('action') === 'display current availability') {
			var session_variable2 = req.session.user;
			console.log(" user is " + session_variable2.user);
			AM.getAllUserRecords(session_variable2.user, function(e,o){
				if (o){
					console.log("returning success");
					res.send(o, 200);
				}
				else{
					res.send(e,400);
				} 

			});
		} else if (req.param('action') === 'delete from db') {
			AM.deleteAvailability(req.param('identity'), function(){
					res.send("gen-success", 200);
			});
		}
	});


// creating new accounts //
	
	app.get('/signup', function(req, res) {
		res.render('signup', {  title: 'Signup', states : CT, roles: RT});
	});
	
	app.post('/signup', function(req, res){
		AM.addNewAccount({
			name 	: req.param('name'),
			email 	: req.param('email'),
			user 	: req.param('user'),
			pass	: req.param('pass'),
			state 	: req.param('state'),
			phone	: req.param('phone'),
			address	: req.param('address'),
			role    : req.param('role')

		}, function(e){
			if (e){
				res.send(e, 400);
			}	else{
				res.send('ok', 200);
			}
		});
	});

// password reset //

	app.post('/lost-password', function(req, res){
	// look up the user's account via their email //
		AM.getAccountByEmail(req.param('email'), function(o){
			if (o){
				res.send('ok', 200);
				EM.dispatchResetPasswordLink(o, function(e, m){
				// this callback takes a moment to return //
				// should add an ajax loader to give user feedback //
					if (!e) {
					//	res.send('ok', 200);
					}	else{
						res.send('email-server-error', 400);
						for (k in e) console.log('error : ', k, e[k]);
					}
				});
			}	else{
				res.send('email-not-found', 400);
			}
		});
	});

	app.get('/reset-password', function(req, res) {
		var email = req.query["e"];
		var passH = req.query["p"];
		AM.validateResetLink(email, passH, function(e){
			if (e != 'ok'){
				res.redirect('/');
			} else{
	// save the user's email in a session instead of sending to the client //
				req.session.reset = { email:email, passHash:passH };
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});
	
	app.post('/reset-password', function(req, res) {
		var nPass = req.param('pass');
	// retrieve the user's email from the session to lookup their account and reset password //
		var email = req.session.reset.email;
	// destory the session immediately after retrieving the stored email //
		req.session.destroy();
		AM.updatePassword(email, nPass, function(e, o){
			if (o){
				res.send('ok', 200);
			}	else{
				res.send('unable to update password', 400);
			}
		})
	});
	
// view & delete accounts //
	
	app.get('/print', function(req, res) {
		AM.getAllRecords( function(e, accounts){
			res.render('print', { title : 'Account List', accts : accounts });
		})
	});
	
	app.post('/delete', function(req, res){
		AM.deleteAccount(req.body.id, function(e, obj){
			if (!e){
				res.clearCookie('user');
				res.clearCookie('pass');
	            req.session.destroy(function(e){ res.send('ok', 200); });
			}	else{
				res.send('record not found', 400);
			}
	    });
	});
	
	app.get('/reset', function(req, res) {
		AM.delAllRecords(function(){
			res.redirect('/print');	
		});
	});

	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

};