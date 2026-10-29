const { nanoid } = require("nanoid");
const URL = require("../models/url");

function normalizeUrl(input) {
  let value = String(input || "").trim();
  if (!value) return null;
  if (!/^https?:\/\//i.test(value)) value = "https://" + value;
  try {
    return new globalThis.URL(value).href;
  } catch (err) {
    return null;
  }
}

async function handleGenerateNewShortURL(req, res) {
  try {
    const redirectURL = normalizeUrl(req.body.url);
    if (!redirectURL) {
      const urls = await URL.find({ createdBy: req.user._id });
      return res.status(400).render("home", { urls, error: "Please enter a valid URL" });
    }

    const shortId = nanoid(8);
    await URL.create({
      shortId,
      redirectURL,
      visitHistory: [],
      createdBy: req.user._id,
    });

    const urls = await URL.find({ createdBy: req.user._id });
    return res.render("home", {
      id: shortId,
      shortUrl: `${req.protocol}://${req.get("host")}/url/${shortId}`,
      urls,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Something went wrong");
  }
}

async function handleRedirect(req, res) {
  try {
    const entry = await URL.findOneAndUpdate(
      { shortId: req.params.shortId },
      { $push: { visitHistory: { timestamp: Date.now() } } }
    );
    if (!entry) return res.status(404).send("Short URL not found");
    return res.redirect(entry.redirectURL);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Something went wrong");
  }
}

async function handleGetAnalytics(req, res) {
  try {
    // only the owner can see the analytics
    const result = await URL.findOne({
      shortId: req.params.shortId,
      createdBy: req.user._id,
    });
    if (!result) return res.status(404).json({ error: "Short URL not found" });

    return res.json({
      totalClicks: result.visitHistory.length,
      analytics: result.visitHistory,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

module.exports = { handleGenerateNewShortURL, handleRedirect, handleGetAnalytics };