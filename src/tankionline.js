const ranks = require('./ranks.js');
const values = require('./values.js')
const fetch = require('node-fetch');

module.exports = class Ratings {
    /**
     * @param {string} username of the user
     * @param {string} lang
     */
    constructor(username, lang = 'en') {
        if (!username) throw new Error('Please specify a username');
        if (typeof lang !== 'string') throw new TypeError(`lang is not a string`);
        let langs = ['en','pl','de','ru','br','es']
        if (!langs.includes(lang.toLowerCase())) throw new Error(`lang must be en/ru/pl/de/br/es`);
        this.userinfo = [username, lang]
    }

    /**
     * Returns ratings of specified user in specified language.
     */
    async stats() {
        let result = await fetch(`https://ratings.tankionline.com/api/eu/profile/?user=${this.userinfo[0]}&lang=${this.userinfo[1]}`);
        let data = await result.json();

        // If player was not found
        if (data.responseType === 'NOT_FOUND') throw new Error(`Player not found ${this.userinfo[0]}`);

        // Ranks
        let rank = await new ranks(data.response.hasPremium, data.response.rank).rank()

        // Values
        let crystalPosition = await new values(data.response.rating.crystals.value, data.response.previousRating.crystals.value).calc()
        let expPosition = await new values(data.response.rating.score.value, data.response.previousRating.score.value).calc()
        let goldsPosition = await new values(data.response.rating.golds.value, data.response.previousRating.golds.value).calc()

        // total supplies used + json build
        let totalsups = 0
        let jsonSupplies = {}
        for(let i=0; i < (data.response.suppliesUsage).length; i++){
            totalsups = totalsups + data.response.suppliesUsage[i].usages
            jsonSupplies[data.response.suppliesUsage[i].name] = data.response.suppliesUsage[i].usages
        }
        jsonSupplies["totalUsages"] = totalsups

        // total time played in ms
        let timeplayedms = 0
        for(let i=0; i < (data.response.modesPlayed).length; i++){
            timeplayedms = timeplayedms + data.response.modesPlayed[i].timePlayed
        }

        // convert to seconds
        let total_seconds = timeplayedms / 1000

        // return
        return {
            name: (data.response.name),
            premium: (data.response.hasPremium ? "Yes" : "No"),
            rank: (rank.name),
            rankimg: (rank.image),
            golds: (data.response.caughtGolds),
            crystals: (data.response.earnedCrystals),
            kills: (data.response.kills),
            deaths: (data.response.deaths),
            kd: ((data.response.deaths) === 0 ? (data.response.kills) / (data.response.deaths) : ((data.response.kills) / (data.response.deaths)).toFixed(2)),
            turretsPlayed: ((data.response.turretsPlayed).length),
            resistanceModules: ((data.response.resistanceModules).length),
            gearScore: (data.response.gearScore),
            exp: {
                expNow: (data.response.score),
                expNext: (data.response.scoreNext),
                expLeft: ((data.response.scoreNext) - (data.response.score))
            },
            playtime: {
                hours: (total_seconds / (60 * 60) | 0),
                minutes: ((total_seconds / 60) % 60 | 0),
                seconds: (total_seconds % 60 | 0)
            },
            supplies: jsonSupplies,
            rating: {
                experience: {
                    position: {
                        now: (data.response.rating.score.position == -1 ? "0" : data.response.rating.score.position),
                        before: (data.response.previousRating.score.position == -1 ? "0" : data.response.previousRating.score.position)
                    },
                    value: {
                        now: (expPosition.current),
                        before: (expPosition.old),
                        arrow: (expPosition.arrow)
                    }
                },
                golds: {
                    position: {
                        now: (data.response.rating.golds.position == -1 ? "0" : data.response.rating.golds.position),
                        before: (data.response.previousRating.golds.position == -1 ? "0" : data.response.previousRating.golds.position)
                    },
                    value: {
                        now: (goldsPosition.current),
                        before: (goldsPosition.old),
                        arrow: (goldsPosition.arrow)
                    }
                },
                crystals: {
                    position: {
                        now: (data.response.rating.crystals.position == -1 ? "0" : data.response.rating.crystals.position),
                        before: (data.response.previousRating.crystals.position == -1 ? "0" : data.response.previousRating.crystals.position)
                    },
                    value: {
                        now: (crystalPosition.current),
                        before: (crystalPosition.old),
                        arrow: (crystalPosition.arrow)
                    }
                },
                efficiency: {
                    position: {
                        now: (data.response.rating.efficiency.position == -1 ? "0" : data.response.rating.efficiency.position)
                    },
                    value: {
                        now: ((data.response.rating.efficiency.value) == -1 ? "0" : Math.floor(data.response.rating.efficiency.value / 100))
                    }
                }
            },
        };
    }
};
