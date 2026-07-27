const initSqlJs = require("sql.js");
const seedOrders = require("../data/seedOrders");

let SQLPromise = null;
const getSQL = () => {
  if (!SQLPromise) SQLPromise = initSqlJs();
  return SQLPromise;
};
const getSalesSummary = async () => {
  const SQL = await getSQL();
  const db = new SQL.Database();

  db.run(`
    CREATE TABLE orders (
      id INTEGER,
      product TEXT,
      category TEXT,
      amount REAL,
      region TEXT,
      order_date TEXT
    )
  `);

  const insert = db.prepare(
    "INSERT INTO orders VALUES (:id, :product, :category, :amount, :region, :orderDate)",
  );
  seedOrders.forEach((o) => {
    insert.run({
      ":id": o.id,
      ":product": o.product,
      ":category": o.category,
      ":amount": o.amount,
      ":region": o.region,
      ":orderDate": o.orderDate,
    });
  });
  insert.free();

  const runQuery = (sql) => {
    const result = db.exec(sql);
    if (!result[0]) return [];
    const { columns, values } = result[0];
    return values.map((row) =>
      Object.fromEntries(row.map((v, i) => [columns[i], v])),
    );
  };

  const totalsRows = runQuery(`
    SELECT COUNT(*) AS totalOrders,
           ROUND(SUM(amount), 2) AS totalRevenue,
           ROUND(AVG(amount), 2) AS avgOrderValue
    FROM orders
  `);

  const byCategory = runQuery(`
    SELECT category, COUNT(*) AS orders, ROUND(SUM(amount), 2) AS revenue
    FROM orders GROUP BY category ORDER BY revenue DESC
  `);

  const byRegion = runQuery(`
    SELECT region, COUNT(*) AS orders, ROUND(SUM(amount), 2) AS revenue
    FROM orders GROUP BY region ORDER BY revenue DESC
  `);

  const topProducts = runQuery(`
    SELECT product, COUNT(*) AS orders, ROUND(SUM(amount), 2) AS revenue
    FROM orders GROUP BY product ORDER BY revenue DESC LIMIT 5
  `);

  db.close();

  return {
    totals: totalsRows[0],
    byCategory,
    byRegion,
    topProducts,
    generatedAt: new Date().toISOString(),
  };
};

module.exports = { getSalesSummary };
