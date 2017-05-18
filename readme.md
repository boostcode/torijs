[![torijs Logo](https://raw.githubusercontent.com/boostcode/torijs/feature/refactoring/.github/tori-logo.png)](https://tori.js.org)

**A NodeJS Backend as a Service**

[![Issues](https://img.shields.io/github/issues/boostcode/torijs.svg?style=flat)](https://github.com/boostcode/torijs/issues)
[![codebeat badge](https://codebeat.co/badges/f859e99c-d115-4969-9aea-c2353338464c)](https://codebeat.co/projects/github-com-boostcode-torijs-master)

![Linux](https://img.shields.io/badge/linux-compatible-green.svg?style=flat)
![macOS](https://img.shields.io/badge/macOS-compatible-4BC51D.svg?style=flat)
![Windows](https://img.shields.io/badge/macOS-compatible-4BC51D.svg?style=flat)

[![Build Status](https://travis-ci.org/boostcode/torijs.svg?branch=develop)](https://travis-ci.org/boostcode/torijs)

## Summary

[torijs](https://tori.js.org) is a *backend as a service* (**BaaS**) written in nodeJS and powered by MongoDB.

It has `core` module that provides:
- basic user management with roles;
- RESTful api;
- dedicated backend for admin user;
- WYSIWYG collection to add new collections with RESTful API automatically;
- Actions and triggers on events (e.g. on update send a push to...);

## Requirements

- NodeJS
- MongoDB

We strongly suggest to use a `Docker` in order to speed up setup and management, we both provide single `docker` or `docker-compose`.

- [torijs docker](https://github.com/boostcode/torijs-docker)
- [torijs docker-compose]()

## Installation

If you want to start using **torijs** you have to:

- Clone torijs repository
`git clone https://github.com/boostcode/torijs.git`

- Move to `torijs` directory
`cd torijs`

- Copy `tori.conf.js.example` to `conf` directory renaming it to `tori.conf.js`
`mv tori.conf.js.example  conf/tori.conf.js`

- Edit `conf/tori.conf.js` with **MongoDB** `ip:port`

- Install deps
`npm install`

- Run torijs
`node bin/www`

torijs will show you a message similar to:

`⛩  torijs is listening on port: 8000`

Point your browser to `ip:port` you set in config and that's all, torijs is working.

## License

This project is licensed under MIT. Full license text is available in [LICENSE](https://raw.githubusercontent.com/boostcode/torijs/master/LICENSE).
