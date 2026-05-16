const pool = require("./pool");

async function query(text, params) {
  const { rows } = await pool.query(text, params);
  return rows;
}

async function queryOne(text, params) {
  const rows = await query(text, params);
  return rows[0] || null;
}

module.exports = {
  query,
  queryOne
};
