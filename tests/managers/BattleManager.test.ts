import { expect } from 'chai';
import 'mocha';

/** Managers */
import { BattleManager } from '../../src/managers/BattleManager';

import { sampleConfig } from '../../seed/battleConfig';
import { LooseObject } from '../../src/interface/LooseObject';

const cloneObject = (obj : LooseObject) : LooseObject => {
  return JSON.parse(JSON.stringify(obj));
}

describe('BattleManager', () => {
  describe('getter functions', () => {
    it('correctly deserializes objects', () => {
      const configClone = cloneObject(sampleConfig);
      const { playerTeam, enemyTeam } = configClone;
      const battleManager : BattleManager = new BattleManager(configClone);
  
      const activeHero = playerTeam['1'];
      const activeEnemy = enemyTeam['3'];
      expect(battleManager.getActivePlayerHero()).to.deep.equal(activeHero);
      expect(battleManager.getActiveEnemyHero()).to.deep.equal(activeEnemy);
    })
    it('correctly turns teams into arrays', () => {
      const configClone = cloneObject(sampleConfig);
      const { playerTeam, enemyTeam } = configClone;
      const battleManager : BattleManager = new BattleManager(configClone);

      const playerTeamArray = Object.keys(playerTeam).map((k : string) => playerTeam[k]);
      const enemyTeamArray = Object.keys(enemyTeam).map((k : string) => enemyTeam[k]);

      expect(battleManager.getEnemyTeam()).to.deep.equal(enemyTeamArray);
      expect(battleManager.getPlayerTeam()).to.deep.equal(playerTeamArray);
    })
  })
  describe('Full game', () => {
    it('correctly processes a full length game', () => {
      const configClone = cloneObject(sampleConfig);
      const sampleMoveSet : LooseObject[] = [{
        name: 'Move1',
        power: 10,
        priority: 0
      }, {
        name: 'Move2',
        power: 10,
        priority: 0
      }]
      const effects : LooseObject[] = [];
      const simplifiedPlayerTeam = {
        '1': { name: 'hero1', attack: 10, defense: 10, health: 4, speed: 50, heroId: '1', effects, moveSet: sampleMoveSet },
        '2': { name: 'hero2', attack: 15, defense: 15, health: 4, speed: 25, heroId: '2', effects, moveSet: sampleMoveSet },
      }
      const simplifiedEnemyTeam = {
        '3': { name: 'enemy1', attack: 10, defense: 10, health: 4, speed: 50, heroId: '3', effects, moveSet: sampleMoveSet },
        '4': { name: 'enemy2', attack: 15, defense: 15, health: 2, speed: 25, heroId: '4', effects, moveSet: sampleMoveSet },
      }
      configClone.playerTeam = simplifiedPlayerTeam;
      configClone.enemyTeam = simplifiedEnemyTeam;
      const battleManager : BattleManager = new BattleManager(configClone);
  
      /** Do the player turn */
      const expectedActionLog1 = [{
        type: 'Action',
        message: 'hero1 used Move1 and dealt 2 to enemy1',
        result: {
          damage: 2,
          move: 'Move1',
          targetHeroId: '3',
          sourceHeroId: '1'
        }
      }, {
        type: 'Action',
        message: 'enemy1 used Move1 and dealt 2 to hero1',
        result: {
          damage: 2,
          move: 'Move1',
          targetHeroId: '1',
          sourceHeroId: '3'
        }
      }]
      const actionLog : LooseObject[] = battleManager.doPlayerTurn({
        actionType: 'ActionTurn',
        move: sampleMoveSet[0],
        sourceHeroId: '1',
        targetHeroIds: ['3'],
        priority: sampleMoveSet[0].priority
      })
      expect(actionLog).to.deep.equal(expectedActionLog1);
      expect(battleManager.getActivePlayerHero().health).to.equal(simplifiedPlayerTeam['1'].health - 2);
      expect(battleManager.getActiveEnemyHero().health).to.equal(simplifiedEnemyTeam['3'].health - 2);
  
      /** Kill an enemy */
      const expectedActionLog2 = [{
        type: 'Action',
        message: 'hero1 used Move1 and dealt 2 to enemy1',
        result: {
          damage: 2,
          move: 'Move1',
          targetHeroId: '3',
          sourceHeroId: '1'
        }
      }, {
        type: 'Death',
        message: 'enemy1 died!',
        result: {
          targetHeroId: '3'
        }
      }, {
        type: 'Switch',
        message: 'Enemy sent out enemy2',
        result: {
          side: 'enemy',
          old: '3',
          new: '4'
        }
      }];
      const actionLog2 : LooseObject[] = battleManager.doPlayerTurn({
        actionType: 'ActionTurn',
        move: sampleMoveSet[0],
        sourceHeroId: '1',
        targetHeroIds: ['3'],
        priority: sampleMoveSet[0].priority
      })
      expect(actionLog2).to.deep.equal(expectedActionLog2);
      expect(battleManager.getActivePlayerHero().health).to.equal(simplifiedPlayerTeam['1'].health - 2);
      expect(battleManager.getActiveEnemyHero().heroId).to.equal('4');
  
      /** Win the battle  */
      const expectedActionLog3 = [{
        type: 'Action',
        message: 'hero1 used Move1 and dealt 2 to enemy2',
        result: {
          damage: 2,
          move: 'Move1',
          targetHeroId: '4',
          sourceHeroId: '1'
        }
      }, {
        type: 'Death',
        message: 'enemy2 died!',
        result: {
          targetHeroId: '4'
        }
      }, {
        type: 'Win',
        result: {
          side: 'player'
        }
      }];

      const actionLog3 : LooseObject[] = battleManager.doPlayerTurn({
        actionType: 'ActionTurn',
        move: sampleMoveSet[0],
        sourceHeroId: '1',
        targetHeroIds: ['4'],
        priority: sampleMoveSet[0].priority
      })
      expect(actionLog3).to.deep.equal(expectedActionLog3);
    })
    it('simulates a game where player loses', () => {
      const configClone = cloneObject(sampleConfig);
      const sampleMoveSet : LooseObject[] = [{
        name: 'Move1',
        power: 10,
        priority: 0
      }, {
        name: 'Move2',
        power: 10,
        priority: 0
      }]
      const effects : LooseObject[] = [];
      const simplifiedPlayerTeam = {
        '1': { name: 'hero1', attack: 10, defense: 10, health: 4, speed: 50, heroId: '1', effects, moveSet: sampleMoveSet },
        '2': { name: 'hero2', attack: 15, defense: 15, health: 4, speed: 25, heroId: '2', effects, moveSet: sampleMoveSet },
      }
      const simplifiedEnemyTeam = {
        '3': { name: 'enemy1', attack: 1000, defense: 10, health: 100, speed: 1000, heroId: '3', effects, moveSet: sampleMoveSet },
        '4': { name: 'enemy2', attack: 1000, defense: 15, health: 100, speed: 1000, heroId: '4', effects, moveSet: sampleMoveSet },
      }
      configClone.playerTeam = simplifiedPlayerTeam;
      configClone.enemyTeam = simplifiedEnemyTeam;
      const battleManager : BattleManager = new BattleManager(configClone);

      const expectedActionLog1 = [{
        type: 'Action',
        message: 'enemy1 used Move1 and dealt 4 to hero1',
        result: {
          damage: 4,
          targetHeroId: '1',
          sourceHeroId: '3',
          move: 'Move1'
        }
      }, {
        type: 'Death',
        message: 'hero1 died!',
        result: {
          targetHeroId: '1'
        }
      }];
      const actionLog1 = battleManager.doPlayerTurn({
        actionType: 'ActionTurn',
        move: sampleMoveSet[0],
        sourceHeroId: '1',
        targetHeroIds: ['3'],
        priority: sampleMoveSet[0].priority
      });
      expect(actionLog1).to.deep.equal(expectedActionLog1);

      /** Player Switch */
      const expectedActionLog2 = [{
        type: 'Switch',
        message: 'Player sent out hero2',
        result: {
          side: 'player',
          old: '1',
          new: '2'
        }
      }, {
        type: 'Action',
        message: 'enemy1 used Move1 and dealt 4 to hero2',
        result: {
          damage: 4,
          targetHeroId: '2',
          sourceHeroId: '3',
          move: 'Move1'
        }
      }, {
        type: 'Death',
        message: 'hero2 died!',
        result: {
          targetHeroId: '2'
        }
      }, {
        type: 'Win',
        result: {
          side: 'enemy'
        }
      }];
      const actionLog2 = battleManager.doPlayerTurn({
        actionType: 'SwitchTurn',
        newActiveHero: '2',
        side: 'player'
      });
      expect(actionLog2).to.deep.equal(expectedActionLog2);
    })
  })
  describe('No configuration game', () => {
    it('Generates a default CPU even if no configuration is passed in', () => {
      const battleManager = new BattleManager({});

      // Get the active player hero
      const playerHero = battleManager.getActivePlayerHero();

      // Get the active enemy hero
      const enemyHero = battleManager.getActiveEnemyHero();

      // Player Input
      const playerAttackTurn = {
          actionType: 'ActionTurn',
          move: playerHero.moveSet[2],
          sourceHeroId: playerHero.heroId,
          targetHeroIds: [enemyHero.heroId],
          priority: playerHero.moveSet[2].priority
      }

      const actionLog : LooseObject[] = battleManager.doPlayerTurn(playerAttackTurn);
      expect(actionLog.length).to.be.greaterThan(1);
    })
  })
})