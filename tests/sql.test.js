// const { describe, it } = require('node:test')
// const assert = require('assert')
// const fs = require('fs')
// const wasm = fs.readFileSync('./process.wasm')
// const m = require(__dirname + '/process.js')


// describe('Graphql Tests', async () => {
//   var instance;
//   const handle = async function (msg, env) {
//     const res = await instance.cwrap('handle', 'string', ['string', 'string'], { async: true })(JSON.stringify(msg), JSON.stringify(env))
//     console.log('Memory used:', instance.HEAP8.length)
//     return JSON.parse(res)
//   }

//   it('Create instance', async () => {
//     console.log("Creating instance...")
//     var instantiateWasm = function (imports, cb) {
//       WebAssembly.instantiate(wasm, imports).then(result =>

//         cb(result.instance)
//       )
//       return {}
//     }

//     instance = await m({
//       ARWEAVE: 'https://arweave.net',
//       mode: "test",
//       blockHeight: 100,
//       spawn: {
//         "Scheduler": "TEST_SCHED_ADDR"
//       },
//       Process: {
//         Id: 'AOS',
//         Owner: 'FOOBAR',
//         tags: [
//           { name: "Extension", value: "Weave-Drive" }
//         ]
//       },
//       instantiateWasm
//     })
//     await new Promise((r) => setTimeout(r, 1000));
//     console.log("Instance created.")
//     await new Promise((r) => setTimeout(r, 250));

//     assert.ok(instance)
//   })


//   it('Parser', async () => {
//     const result = await handle(getEval(`
// local luagraphqlparser = require('luagraphqlparser')
// local res = luagraphqlparser.parse([[
//     query HeroComparison($first: Int = 3) {
//       leftComparison: hero(episode: EMPIRE) {
//         ...comparisonFields
//       }
//       rightComparison: hero(episode: JEDI) {
//         ...comparisonFields
//       }
//     }
    
//     fragment comparisonFields on Character {
//       name
//       friendsConnection(first: $first) {
//         totalCount
//         edges {
//           node {
//             name
//           }
//         }
//       }
//     }
// ]])
// return res

//   `), getEnv())
//   console.log(result.response)
//     assert.ok(result.response.Output.data.length > 10)
//   })


// });


// function getEval(expr) {
//   return {
//     Target: 'AOS',
//     From: 'FOOBAR',
//     Owner: 'FOOBAR',

//     Module: 'FOO',
//     Id: '1',

//     'Block-Height': '1000',
//     Timestamp: Date.now(),
//     Tags: [
//       { name: 'Action', value: 'Eval' }
//     ],
//     Data: expr
//   }
// }

// function getEnv() {
//   return {
//     Process: {
//       Id: 'AOS',
//       Owner: 'FOOBAR',

//       Tags: [
//         { name: 'Name', value: 'TEST_PROCESS_OWNER' }
//       ]
//     }
//   }
// }


import { test } from 'node:test'
import * as assert from 'node:assert'
import AoLoader from '@permaweb/ao-loader'
import fs from 'fs'

const wasm = fs.readFileSync('./process.wasm')
const options = { format: "wasm64-unknown-emscripten-draft_2024_02_15" }

test('graphql', async () => {
    const handle = await AoLoader(wasm, options)
    const env = {
        Process: {
            Id: 'AOS',
            Owner: 'FOOBAR',
            Tags: [
                { name: 'Name', value: 'Thomas' }
            ]
        }
    }
    const msg = {
        Target: 'AOS',
        From: 'FOOBAR',
        Owner: 'FOOBAR',
        ['Block-Height']: "1000",
        Id: "1234xyxfoo",
        Module: "WOOPAWOOPA",
        Tags: [
            { name: 'Action', value: 'Eval' }
        ],
        Data: `
local sqlite_vec = require('lsqlitevec')
sqlite_vec.load()

local sqlite = require('lsqlite3')
local db = sqlite.open_memory()

local res = db:exec[[
create virtual table vec_examples using vec0(
  sample_embedding float[8]
);

-- vectors can be provided as JSON or in a compact binary format
insert into vec_examples(rowid, sample_embedding)
  values
    (1, '[-0.200, 0.250, 0.341, -0.211, 0.645, 0.935, -0.316, -0.924]'),
    (2, '[0.443, -0.501, 0.355, -0.771, 0.707, -0.708, -0.185, 0.362]'),
    (3, '[0.716, -0.927, 0.134, 0.052, -0.669, 0.793, -0.634, -0.162]'),
    (4, '[-0.710, 0.330, 0.656, 0.041, -0.990, 0.726, 0.385, -0.958]');

-- KNN style query
select
  rowid,
  distance
from vec_examples
where sample_embedding match '[0.890, 0.544, 0.825, 0.961, 0.358, 0.0196, 0.521, 0.175]'
order by distance
limit 2;
]]
if res ~= sqlite.OK then
    return "Error setting up: " .. db:errmsg()
end

local query = [[
select
  rowid,
  distance
from vec_examples
where sample_embedding match '[0.890, 0.544, 0.825, 0.961, 0.358, 0.0196, 0.521, 0.175]'
order by distance
limit 2;
]]

local stmt = db:prepare(query);
if stmt == nil then
    return db:errmsg()
end

local outputString = ""
while stmt:step() == sqlite.ROW do
    outputString = outputString .. stmt:get_value(1) .. ','
end

return outputString
`
    }

    // load handler
    const result = await handle(null, msg, env)
    delete result.Memory

    // console.log(result)

    assert.strictEqual(result.Output?.data, '2.3868737220764,2.3897850513458,')
})
