const Dev = require('../models/Dev');

module.exports = {
  async store(req, res) {
    const { user } = req.headers;
    const { devId } = req.params;

    const loggedDev = await Dev.findById(user);
    let targetDev = null

    try {
      targetDev = await Dev.findById(devId);
    } catch (error) {
      return res.status(400).json({ error: 'Dev not exists' });
    }
    

    loggedDev.dislikes.push(targetDev._id);

    await loggedDev.save();

    return res.json(loggedDev);
  }
};