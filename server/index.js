const express = require('express');
const path = require('path');

const app = express();

const clientPath = path.join(__dirname, '..', 'client');

app.use(express.static(clientPath));

app.get('*', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log('Server is up on port ' + port);
});