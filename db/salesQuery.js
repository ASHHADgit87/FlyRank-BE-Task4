const seedOrders = require("../data/seedOrders");

const round2 = (value) => Number(value.toFixed(2));

const buildFallbackSummary = () => {
  const orders = Array.isArray(seedOrders) ? seedOrders : [];
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const byCategory = Object.entries(
    orders.reduce((acc, order) => {
      const category = order.category || "Unknown";
      if (!acc[category]) {
        acc[category] = { category, orders: 0, revenue: 0 };
      }
      acc[category].orders += 1;
      acc[category].revenue += Number(order.amount || 0);
      return acc;
    }, {}),
  )
    .map(([, value]) => ({
      category: value.category,
      orders: value.orders,
      revenue: round2(value.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const byRegion = Object.entries(
    orders.reduce((acc, order) => {
      const region = order.region || "Unknown";
      if (!acc[region]) {
        acc[region] = { region, orders: 0, revenue: 0 };
      }
      acc[region].orders += 1;
      acc[region].revenue += Number(order.amount || 0);
      return acc;
    }, {}),
  )
    .map(([, value]) => ({
      region: value.region,
      orders: value.orders,
      revenue: round2(value.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const topProducts = Object.entries(
    orders.reduce((acc, order) => {
      const product = order.product || "Unknown";
      if (!acc[product]) {
        acc[product] = { product, orders: 0, revenue: 0 };
      }
      acc[product].orders += 1;
      acc[product].revenue += Number(order.amount || 0);
      return acc;
    }, {}),
  )
    .map(([, value]) => ({
      product: value.product,
      orders: value.orders,
      revenue: round2(value.revenue),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    totals: {
      totalOrders,
      totalRevenue: round2(totalRevenue),
      avgOrderValue: round2(avgOrderValue),
    },
    byCategory,
    byRegion,
    topProducts,
    generatedAt: new Date().toISOString(),
  };
};

const getSalesSummary = async () => {
  try {
    const initSqlJs = require("sql.js");
    const SQL = await initSqlJs();
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
    seedOrders.forEach((order) => {
      insert.run({
        ":id": order.id,
        ":product": order.product,
        ":category": order.category,
        ":amount": order.amount,
        ":region": order.region,
        ":orderDate": order.orderDate,
      });
    });
    insert.free();

    const runQuery = (sql) => {
      const result = db.exec(sql);
      if (!result[0]) return [];
      const { columns, values } = result[0];
      return values.map((row) =>
        Object.fromEntries(row.map((value, index) => [columns[index], value])),
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
  } catch (error) {
    console.warn(
      "sql.js initialization failed, using in-memory fallback summary:",
      error.message,
    );
    return buildFallbackSummary();
  }
};

module.exports = { getSalesSummary };
