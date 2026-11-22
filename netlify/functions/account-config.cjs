'use strict';
const readConfig=require('../../account-config.cjs');
exports.handler=async event=>({
  statusCode:event.httpMethod==='GET'?200:405,
  headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'},
  body:JSON.stringify(event.httpMethod==='GET'?readConfig():{error:'Method not allowed.'})
});
