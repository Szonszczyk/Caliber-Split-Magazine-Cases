import * as fs from 'fs';
import * as path from "path";

import { WTTInstanceManager } from "./WTTInstanceManager";
import { CombinedConfigItem, ConfigItem, Grid } from "./references/consts";
import idDatabase from "../db/Ids/idDatabase.json";
import { Traders } from '@spt/models/enums/Traders';

export class CasesGeneration
{
    private Instance: WTTInstanceManager;

    public preSptLoad(Instance: WTTInstanceManager): void
    {
        this.Instance = Instance;
    }

    public postDBLoad(): CombinedConfigItem {
        const config = this.Instance.helpers.config;
        const magazines = this.loadMagazines();
        const ammoConfig: { [id: string]: { name: string; shortName: string } } = this.Instance.helpers.idToCaliberMap;
        const generatedItems: CombinedConfigItem = {};
        const idDatabaseOriginal = structuredClone(idDatabase);
        for (const caliberID in magazines) {
            const caliber = magazines[caliberID];
            const caseId = this.resolveHash(`CASEID${caliberID}`);
            const newCase: ConfigItem = {
                itemTplToClone: "5c127c4486f7745625356c13",
                overrideProperties: {
                    BackgroundColor: this.Instance.helpers.colorConverterAPILoaded ? config.backgroundColorColorConverterAPI : config.backgroundColor,
                    Weight: 0,
                    Width: config.Width,
                    Height: config.Height,
                    CanSellOnRagfair: config.fleaMarketBlacklisted
                },
                parentId: "5795f317245977243854e041",
                handbookParentId: "5b5f6fa186f77409407a7eb7",
                locales: {
                    en: {
                        name: `<b>Custom Magazine Case for ${ammoConfig[caliberID] ? ammoConfig[caliberID].name : caliberID} caliber</b>`,
                        shortName: `${ammoConfig[caliberID] ? ammoConfig[caliberID].shortName : caliberID} CMC`,
                        description: [
                            `<align="center">Custom magazine case that can store all your <b>${ammoConfig[caliberID] ? ammoConfig[caliberID].name : caliberID}</b> magazines!</align>`
                        ].join('\n')
                    }
                },
                fleaPriceRoubles: Math.floor(config.handbookPriceRoubles*1.3),
                handbookPriceRoubles: config.handbookPriceRoubles,
                clearClonedProps: true,
                addtoInventorySlots: [],
                addtoModSlots: false,
                modSlot: [],
                ModdableItemWhitelist: "",
                ModdableItemBlacklist: "",
                addtoTraders: false,
                traderId: Traders.REF,
                traderItems: [],
                barterScheme: [],
                loyallevelitems: 1,
                addtoBots: false,
                addtoStaticLootContainers: false,
                StaticLootContainers: "",
                Probability: 0,
                masteries: false,
                masterySections: {},
                addweaponpreset: false,
                weaponpresets: [],
                addtoHallOfFame: false,
                addtoSpecialSlots: false
            };

            this.addToTraders(newCase);
            this.addGridsWholeCaseForCaliber(caseId, newCase, caliber);
            
            generatedItems[caseId] = newCase;
        }
        if (JSON.stringify(idDatabaseOriginal, null, 2) != JSON.stringify(idDatabase, null, 2) ) {
            fs.writeFileSync(path.join(__dirname, "../db/Ids/idDatabase.json"), JSON.stringify(idDatabase, null, 2));
        }
        return generatedItems;
    }

    private addToTraders(newCase: ConfigItem): void {
        const config = this.Instance.helpers.config;
        if (config.casesOnSkier) {
            newCase.addtoTraders = true;
            newCase.traderId = Traders.SKIER;
            newCase.traderItems.push({
                "unlimitedCount": true,
                "stackObjectsCount": 5
            });
            newCase.barterScheme.push({
                "count": config.EuroPrice,
                "_tpl": "569668774bdc2da2298b4568"
            });
        } else
        if (config.casesOnPeacekeeper) {
            newCase.addtoTraders = true;
            newCase.traderId = Traders.PEACEKEEPER;
            newCase.traderItems.push({
                "unlimitedCount": true,
                "stackObjectsCount": 5
            });
            newCase.barterScheme.push({
                "count": config.USDPrice,
                "_tpl": "5696686a4bdc2da3298b456a"
            });
        } else
        if (config.casesOnRef) {
            newCase.addtoTraders = true;
            newCase.traderId = Traders.REF;
            newCase.traderItems.push({
                "unlimitedCount": true,
                "stackObjectsCount": 5
            });
            newCase.barterScheme.push({
                "count": config.gpCoinPrice,
                "_tpl": "5d235b4d86f7742e017bc88a"
            });
        } else
        if (config.casesOnJaeger) {
            newCase.addtoTraders = true;
            newCase.traderId = Traders.JAEGER;
            newCase.traderItems.push({
                "unlimitedCount": true,
                "stackObjectsCount": 5
            });
            newCase.barterScheme.push({
                "count": Math.floor(config.RoublesPriceMultiplier*config.handbookPriceRoubles),
                "_tpl": "5449016a4bdc2d6f028b456f"
            });
        } else
        if (config.casesOnPrapor) {
            newCase.addtoTraders = true;
            newCase.traderId = Traders.PRAPOR;
            newCase.traderItems.push({
                "unlimitedCount": true,
                "stackObjectsCount": 5
            });
            newCase.barterScheme.push({
                "count": config.barterPrice,
                "_tpl": config.barterType
            });
        }
    }

    private addGridsWholeCaseForCaliber(
        caseId: string,
        newCase: ConfigItem,
        ammoInCase: string[]
    ): void {
        const config = this.Instance.helpers.config;
        const grids: Grid[] = [];
        grids.push({
            _id: this.resolveHash(`CASE:${caseId}#AMMO:ALL#`),
            _name: `CASE:${caseId}#AMMO:ALL#`,
            _parent: caseId,
            _proto: "55d329c24bdc2d892f8b4567",
            _props: {
                cellsH: config.caseWidth,
                cellsV: config.caseWidth,
                filters: [{
                    Filter: ammoInCase,
                    ExcludedFilter: []
                }],
                isSortingTable: false,
                maxCount: 0,
                maxWeight: 0,
                minCount: 0
            }
        });

        newCase.overrideProperties.Grids = grids;
    }

    private loadMagazines() : { [caliberID: string]: string[] } {
        const magazines: { [caliberID: string]: string[] } = {};

        const caliberConfig: { [id: string]: { name: string; shortName: string } } = this.Instance.helpers.idToCaliberMap;
        const items = this.Instance.database.templates.items;
        const config = this.Instance.helpers.config;

        for (const id in items) {
            const item = items[id];
            if (item._parent != "5448bc234bdc2d3c308b4569" || item._props.ReloadMagType != "ExternalMagazine") continue;

            const filter: string[] = item._props.Cartridges[0]._props.filters[0].Filter;

            for (const ammo of filter) {
                const ammoCaliber = items[ammo]._props.Caliber;

                // only use known calibers
                if (config.useOnlyKnownCalibers && !caliberConfig[ammoCaliber]) continue;

                // use all calibers, just remove known bad/unnecessary ones
                if (config.removeBadCalibers && config.badCalibers.includes(ammoCaliber)) continue;

                if (!magazines[ammoCaliber]) magazines[ammoCaliber] = [];
                if (magazines[ammoCaliber].includes(id)) continue;

                magazines[ammoCaliber].push(id);
            }
        }

        return magazines;
    }

    private resolveHash(ID: string): string {
        if (!idDatabase[ID]) {
            idDatabase[ID] = this.Instance.hashUtil.generate();
        }
        return idDatabase[ID];
    }
}