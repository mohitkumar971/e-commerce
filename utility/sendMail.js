
const mailjet = require('node-mailjet');

const transporter = mailjet.connect(
  "3d0fa9716e2c1e82c550c8a0acaf87fa",
  "b4fe3c4915fb015fcb71555423cde3dd"
)

module.exports = function sendMail( email, title, body, html, callback )
{
  const request = transporter.post('send').request({
  FromEmail: 'mohitkumar41830@gmail.com',
  FromName: 'e-commerce App',
  Subject: title,
  'Text-part': body,
  'Html-part': html,
  Recipients: [{ Email: email }],
})
request
.then(result => {
    callback();
  })
  .catch(err => {
    callback("error occured");
  })
}