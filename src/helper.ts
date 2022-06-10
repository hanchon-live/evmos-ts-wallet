// In case node-fetch is not working for you, you can use this fetch and post implementation, axios is another option
// I'm using node-fetch@2 that doesn't force ESM

import { request as requestHttp } from 'http'
import { request as requestHttps } from 'https'
import { URL } from 'url'

export const fetch = async (urlString: string) => {
  const url = new URL(urlString)
  const doRequest = url.protocol === 'https:' ? requestHttps : requestHttp
  return new Promise<string>((resolve, reject) => {
    const req = doRequest(url, (res) => {
      if (res === undefined || res.statusCode === undefined) {
        return reject(new Error(`Undefined response`))
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Status Code: ${res.statusCode}`))
      }
      const data: any = []
      res.on('data', (chunk) => {
        data.push(chunk)
      })
      res.on('end', () => resolve(Buffer.concat(data).toString()))
    })
    req.on('error', reject)
    req.end()
  })
}

export const post = async (
  host: string,
  port: string,
  path: string,
  postData: string,
  https: boolean = false,
) => {
  const doRequest = https === true ? requestHttps : requestHttp

  const options = {
    host,
    port,
    path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  }
  console.log(options)

  return new Promise<string>((resolve, reject) => {
    const req = doRequest(options, (res) => {
      res.setEncoding('utf8')
      let data: string = ''
      res.on('data', (chunk) => {
        data = `${data}${chunk}`
      })
      res.on('end', () => resolve(data))
    })
    req.on('error', reject)
    // post the data
    req.write(postData)
    req.end()
  })
}
