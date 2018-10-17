process.env.NO_OUTPUT = true;

const server = require("../src/server/index");
const app = server("./test/data.json", 8000);
const testData = require("./data.json");
const axios = require("axios");

beforeEach(async () => {
  await app.start();
});
afterEach(() => {
  app.stop();
});

test("ensure that the service started", async () => {
  const data = await axios.get("http://localhost:8000/");
  expect(data.status).toBe(200);
});

test("ensure that get works", async () => {
  const data = await axios.get("http://localhost:8000/home");
  expect(data.status).toBe(200);
  expect(data.data).toEqual(testData["/home"]["get"]);
});

test("ensure that post works", async () => {
  const data = await axios.post("http://localhost:8000/home");
  expect(data.status).toBe(200);
  expect(data.data).toEqual(testData["/home"]["post"]);
});

test("ensure that params work", async () => {
  const data = await axios.get("http://localhost:8000/test/12");
  expect(data.status).toBe(200);
  expect(data.data).toEqual(testData["/test/:id"]["get"]);
});
