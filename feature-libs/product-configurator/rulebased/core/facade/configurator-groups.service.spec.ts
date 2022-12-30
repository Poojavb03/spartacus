import { Type } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';
import { ActiveCartFacade } from '@spartacus/cart/base/root';
import { ConfiguratorModelUtils } from '@spartacus/product-configurator/common';
import { Observable, of } from 'rxjs';
import {
  CONFIG_ID,
  GROUP_ID_1,
  GROUP_ID_2,
  GROUP_ID_3,
  GROUP_ID_4,
  GROUP_ID_CONFLICT_3,
  productConfiguration,
  productConfigurationWithConflicts,
} from '../../testing/configurator-test-data';
import { ConfiguratorTestUtils } from '../../testing/configurator-test-utils';
import { ConfiguratorActions } from '../state/actions/index';
import { StateWithConfigurator } from '../state/configurator-state';
import { Configurator } from './../model/configurator.model';
import { ConfiguratorCartService } from './configurator-cart.service';
import { ConfiguratorCommonsService } from './configurator-commons.service';
import { ConfiguratorGroupStatusService } from './configurator-group-status.service';
import { ConfiguratorGroupsService } from './configurator-groups.service';
import { ConfiguratorUtilsService } from './utils/configurator-utils.service';

const PRODUCT_CONFIG_CURRENT_GROUP_IS_CONFLICT: Configurator.Configuration = {
  ...productConfigurationWithConflicts,
  interactionState: {
    ...productConfigurationWithConflicts.interactionState,
    currentGroup: GROUP_ID_CONFLICT_3,
    isConflictResolutionMode: true,
  },
};

class MockActiveCartService {}
class MockConfiguratorCartService {
  checkForActiveCartUpdateDone(): Observable<boolean> {
    return of(true);
  }
}

describe('ConfiguratorGroupsService', () => {
  let classUnderTest: ConfiguratorGroupsService;
  let store: Store<StateWithConfigurator>;
  let configuratorCommonsService: ConfiguratorCommonsService;
  let configGroupStatusService: ConfiguratorGroupStatusService;
  let configFacadeUtilsService: ConfiguratorUtilsService;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [StoreModule.forRoot({})],
        providers: [
          ConfiguratorGroupsService,
          ConfiguratorCommonsService,
          ConfiguratorGroupStatusService,
          ConfiguratorUtilsService,
          {
            provide: ActiveCartFacade,
            useClass: MockActiveCartService,
          },
          {
            provide: ConfiguratorCartService,
            useClass: MockConfiguratorCartService,
          },
        ],
      }).compileComponents();
    })
  );
  beforeEach(() => {
    classUnderTest = TestBed.inject(
      ConfiguratorGroupsService as Type<ConfiguratorGroupsService>
    );
    store = TestBed.inject(Store as Type<Store<StateWithConfigurator>>);
    configuratorCommonsService = TestBed.inject(
      ConfiguratorCommonsService as Type<ConfiguratorCommonsService>
    );
    configGroupStatusService = TestBed.inject(
      ConfiguratorGroupStatusService as Type<ConfiguratorGroupStatusService>
    );
    configFacadeUtilsService = TestBed.inject(
      ConfiguratorUtilsService as Type<ConfiguratorUtilsService>
    );

    spyOn(store, 'dispatch').and.stub();
    spyOn(store, 'pipe').and.returnValue(of(productConfiguration));

    spyOn(configGroupStatusService, 'setGroupStatusVisited').and.callThrough();
    spyOn(configGroupStatusService, 'isGroupVisited').and.callThrough();
    spyOn(configFacadeUtilsService, 'getParentGroup').and.callThrough();
    spyOn(configFacadeUtilsService, 'hasSubGroups').and.callThrough();
    spyOn(configFacadeUtilsService, 'getGroupById').and.callThrough();
  });

  it('should create service', () => {
    spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
      of(productConfiguration)
    );
    expect(classUnderTest).toBeDefined();
  });

  describe('getCurrentGroupId', () => {
    it('should return a current group ID from state', (done) => {
      spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
        of(productConfiguration)
      );
      const currentGroup = classUnderTest.getCurrentGroupId(
        productConfiguration.owner
      );

      expect(currentGroup).toBeDefined();
      currentGroup.subscribe((groupId) => {
        expect(groupId).toBe(GROUP_ID_2);
        done();
      });
    });

    it('should return a current group ID from configuration', (done) => {
      spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
        of({
          ...productConfiguration,
          interactionState: { currentGroup: null },
        })
      );
      const currentGroup = classUnderTest.getCurrentGroupId(
        productConfiguration.owner
      );

      expect(currentGroup).toBeDefined();
      currentGroup.subscribe((groupId) => {
        expect(groupId).toBe(GROUP_ID_1);
        done();
      });
    });

    it('should return undefined if no group exist', (done) => {
      const configNoGroups: Configurator.Configuration = {
        ...ConfiguratorTestUtils.createConfiguration(
          'abc',
          ConfiguratorModelUtils.createInitialOwner()
        ),
      };
      spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
        of(configNoGroups)
      );

      const currentGroupId = classUnderTest.getCurrentGroupId(
        productConfiguration.owner
      );
      currentGroupId.subscribe((groupId) => {
        expect(groupId).toBeUndefined();
        done();
      });
    });
  });

  describe('getMenuParentGroup', () => {
    it('should get the parentGroup from uiState', (done) => {
      spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
        of(productConfiguration)
      );
      const parentGroup = classUnderTest.getMenuParentGroup(
        productConfiguration.owner
      );

      expect(parentGroup).toBeDefined();
      parentGroup.subscribe((group) => {
        expect(group).toBe(productConfiguration.groups[2]);
        done();
      });
    });

    it('should return undefined if menu parent group is not availaible in uiState', (done) => {
      const configurationWoMenuParentGroup =
        ConfiguratorTestUtils.createConfiguration(
          CONFIG_ID,
          ConfiguratorModelUtils.createInitialOwner()
        );
      spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
        of(configurationWoMenuParentGroup)
      );
      const parentGroup = classUnderTest.getMenuParentGroup(
        productConfiguration.owner
      );

      expect(parentGroup).toBeDefined();
      parentGroup.subscribe((group) => {
        expect(group).toBeUndefined();
        done();
      });
    });

    it('should return undefined if menu parent group cannot be found', (done) => {
      const configurationWoMenuParentGroup: Configurator.Configuration = {
        ...ConfiguratorTestUtils.createConfiguration(
          CONFIG_ID,
          ConfiguratorModelUtils.createInitialOwner()
        ),
        interactionState: {
          menuParentGroup: 'Conflict header group that is gone',
        },
      };
      spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
        of(configurationWoMenuParentGroup)
      );
      const parentGroup = classUnderTest.getMenuParentGroup(
        productConfiguration.owner
      );

      expect(parentGroup).toBeDefined();
      parentGroup.subscribe((group) => {
        expect(group).toBeUndefined();
        done();
      });
    });
  });

  describe('getNextGroupId', () => {
    it('should return a next group', (done) => {
      spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
        of(productConfiguration)
      );
      const currentGroup = classUnderTest.getNextGroupId(
        productConfiguration.owner
      );

      expect(currentGroup).toBeDefined();
      currentGroup.subscribe((groupId) => {
        expect(groupId).toBe(GROUP_ID_4);
        done();
      });
    });
  });

  describe('getPreviousGroupId', () => {
    it('should return null in case commons service returns an undefined configuration', (done) => {
      spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
        of(undefined)
      );
      const currentGroup = classUnderTest.getPreviousGroupId(
        productConfiguration.owner
      );

      expect(currentGroup).toBeDefined();
      currentGroup.subscribe((groupId) => {
        expect(groupId).toBeUndefined();
        done();
      });
    });

    it('should return a previous group ID', (done) => {
      spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
        of(productConfiguration)
      );
      const currentGroup = classUnderTest.getPreviousGroupId(
        productConfiguration.owner
      );

      expect(currentGroup).toBeDefined();
      currentGroup.subscribe((groupId) => {
        expect(groupId).toBe(GROUP_ID_1);
        done();
      });
    });

    it('should return null in case configuration is in immediate conflict resolution and previous group is a conflict one', (done) => {
      let configurationWithConflicts = structuredClone(productConfigurationWithConflicts);
      configurationWithConflicts.immediateConflictResolution = true;

      spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
        of(configurationWithConflicts)
      );
      const currentGroup = classUnderTest.getPreviousGroupId(
        configurationWithConflicts.owner
      );

      expect(currentGroup).toBeDefined();
      currentGroup.subscribe((groupId) => {
        expect(groupId).toBeUndefined();
        done();
      });
    });

    it('should return a previous group ID in case configuration is in immediate conflict resolution and previous group not is a conflict one', (done) => {
      let configurationWithConflicts = structuredClone(productConfigurationWithConflicts);
      configurationWithConflicts.immediateConflictResolution = true;
      configurationWithConflicts.interactionState.currentGroup =
        GROUP_ID_2;
      configurationWithConflicts.interactionState.menuParentGroup =
        GROUP_ID_3;

      spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
        of(configurationWithConflicts)
      );
      const currentGroup = classUnderTest.getPreviousGroupId(
        configurationWithConflicts.owner
      );

      expect(currentGroup).toBeDefined();
      currentGroup.subscribe((groupId) => {
        expect(groupId).toBe(GROUP_ID_1);
        done();
      });
    });
  });

  describe('setGroupStatusVisited', () => {
    it('should call setGroupStatusVisited of groupStatusService', () => {
      spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
        of(productConfiguration)
      );
      classUnderTest.setGroupStatusVisited(
        productConfiguration.owner,
        productConfiguration.groups[0].id
      );

      expect(configGroupStatusService.setGroupStatusVisited).toHaveBeenCalled();
    });
  });

  it('should delegate setting the parent group to the store', () => {
    spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
      of(productConfiguration)
    );
    classUnderTest.setMenuParentGroup(productConfiguration.owner, GROUP_ID_1);
    const expectedAction = new ConfiguratorActions.SetMenuParentGroup({
      entityKey: productConfiguration.owner.key,
      menuParentGroup: GROUP_ID_1,
    });
    expect(store.dispatch).toHaveBeenCalledWith(expectedAction);
  });

  it('should call group status in navigate to different group', () => {
    spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
      of(productConfiguration)
    );
    classUnderTest.navigateToGroup(
      productConfiguration,
      productConfiguration.groups[2].id
    );

    expect(configGroupStatusService.setGroupStatusVisited).toHaveBeenCalled();
  });

  it('should check whether isGroupVisited has been called by the configuration group utils service', () => {
    classUnderTest.isGroupVisited(productConfiguration.owner, GROUP_ID_4);
    expect(configGroupStatusService.isGroupVisited).toHaveBeenCalledWith(
      productConfiguration.owner,
      GROUP_ID_4
    );
    expect(configGroupStatusService.isGroupVisited).toHaveBeenCalled();
  });

  it('should get first conflict group from configuration, no conflicts', () => {
    expect(classUnderTest.getFirstConflictGroup(productConfiguration)).toBe(
      undefined
    );
  });

  it('should get first conflict group from configuration', () => {
    expect(
      classUnderTest.getFirstConflictGroup(productConfigurationWithConflicts)
    ).toBe(productConfigurationWithConflicts.flatGroups[0]);
  });

  describe('navigateToConflictSolver', () => {
    it('should trigger change group action in case conflict group deviates from current one', () => {
      spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
        of(productConfigurationWithConflicts)
      );
      classUnderTest.navigateToConflictSolver(
        productConfigurationWithConflicts.owner
      );

      expect(store.dispatch).toHaveBeenCalledWith(
        new ConfiguratorActions.ChangeGroup({
          configuration: productConfigurationWithConflicts,
          groupId: productConfigurationWithConflicts.flatGroups[0].id,
          parentGroupId: productConfigurationWithConflicts.groups[0].id,
          conflictResolutionMode: true,
        })
      );
    });
    it('should also trigger change group action in case current group is already the first conflict group because group menu component relies on interactionState.issueNavigationDone', () => {
      spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
        of(PRODUCT_CONFIG_CURRENT_GROUP_IS_CONFLICT)
      );
      classUnderTest.navigateToConflictSolver(
        PRODUCT_CONFIG_CURRENT_GROUP_IS_CONFLICT.owner
      );

      expect(store.dispatch).toHaveBeenCalledWith(
        new ConfiguratorActions.ChangeGroup({
          configuration: PRODUCT_CONFIG_CURRENT_GROUP_IS_CONFLICT,
          groupId: PRODUCT_CONFIG_CURRENT_GROUP_IS_CONFLICT.flatGroups[0].id,
          parentGroupId: PRODUCT_CONFIG_CURRENT_GROUP_IS_CONFLICT.groups[0].id,
          conflictResolutionMode: true,
        })
      );
    });
    it('should not navigate in case no conflict group is present', () => {
      const consistentConfiguration =
        ConfiguratorTestUtils.createConfiguration('1');
      spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
        of(consistentConfiguration)
      );
      classUnderTest.navigateToConflictSolver(consistentConfiguration.owner);
      expect(store.dispatch).toHaveBeenCalledTimes(0);
    });
  });

  describe('navigateToFirstIncompleteGroup', () => {
    it('should go to first incomplete group', () => {
      spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
        of(productConfiguration)
      );
      classUnderTest.navigateToFirstIncompleteGroup(productConfiguration.owner);

      expect(store.dispatch).toHaveBeenCalledWith(
        new ConfiguratorActions.ChangeGroup({
          configuration: productConfiguration,
          groupId: productConfiguration.flatGroups[0].id,
          parentGroupId: undefined,
          conflictResolutionMode: false,
        })
      );
    });
    it('should not navigate in case no incomplete group is present', () => {
      const completeConfiguration =
        ConfiguratorTestUtils.createConfiguration('1');
      spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
        of(completeConfiguration)
      );
      classUnderTest.navigateToFirstIncompleteGroup(productConfiguration.owner);

      expect(store.dispatch).toHaveBeenCalledTimes(0);
    });
  });

  it('should delegate calls for parent group to the facade utils service', () => {
    classUnderTest.getParentGroup(
      productConfiguration.groups,
      productConfiguration.groups[2].subGroups[0]
    );
    expect(configFacadeUtilsService.getParentGroup).toHaveBeenCalledWith(
      productConfiguration.groups,
      productConfiguration.groups[2].subGroups[0]
    );
  });

  it('should delegate calls for sub groups to the facade utils service', () => {
    classUnderTest.hasSubGroups(productConfiguration.groups[2]);
    expect(configFacadeUtilsService.hasSubGroups).toHaveBeenCalledWith(
      productConfiguration.groups[2]
    );
    expect(configFacadeUtilsService.hasSubGroups).toHaveBeenCalled();
  });

  it('should return true if groupType is a conflict group type otherwise false', () => {
    expect(
      classUnderTest.isConflictGroupType(
        Configurator.GroupType.CONFLICT_HEADER_GROUP
      )
    ).toBe(true);
    expect(
      classUnderTest.isConflictGroupType(Configurator.GroupType.CONFLICT_GROUP)
    ).toBe(true);
    expect(
      classUnderTest.isConflictGroupType(Configurator.GroupType.ATTRIBUTE_GROUP)
    ).toBe(false);
  });

  describe('getConflictGroupsForImmediateConflictResolution', () => {
    it('should return no conflict groups', (done) => {
      spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
        of(productConfiguration)
      );
      const conflictGroups =
        classUnderTest.getConflictGroupsForImmediateConflictResolution(
          productConfiguration.owner
        );

      expect(conflictGroups).toBeDefined();
      conflictGroups.subscribe((groups) => {
        expect(groups.length).toBe(0);
        done();
      });
    });

    it('should return conflict groups', (done) => {
      productConfigurationWithConflicts.immediateConflictResolution = true;
      spyOn(configuratorCommonsService, 'getConfiguration').and.returnValue(
        of(productConfigurationWithConflicts)
      );
      const conflictGroups =
        classUnderTest.getConflictGroupsForImmediateConflictResolution(
          productConfigurationWithConflicts.owner
        );

      expect(conflictGroups).toBeDefined();
      conflictGroups.subscribe((groups) => {
        expect(groups.length).toBe(3);
        done();
      });
    });
  });

  describe('isConflictGroupInImmediateConflictResolutionMode', () => {
    it('should return false in case both group type and immediateConflictResolution attributes are undefined', () => {
      expect(
        classUnderTest['isConflictGroupInImmediateConflictResolutionMode'](
          undefined,
          undefined
        )
      ).toBe(false);
    });

    it('should return false in case group type is undefined', () => {
      expect(
        classUnderTest['isConflictGroupInImmediateConflictResolutionMode'](
          undefined,
          false
        )
      ).toBe(false);
    });

    it('should return false in case immediateConflictResolution is set to undefined', () => {
      expect(
        classUnderTest['isConflictGroupInImmediateConflictResolutionMode'](
          Configurator.GroupType.ATTRIBUTE_GROUP,
          undefined
        )
      ).toBe(false);
    });

    it('should return false in case group type is AttributeGroup', () => {
      expect(
        classUnderTest['isConflictGroupInImmediateConflictResolutionMode'](
          Configurator.GroupType.ATTRIBUTE_GROUP,
          true
        )
      ).toBe(false);
    });

    it('should return false in case immediateConflictResolution attributes is set to false', () => {
      expect(
        classUnderTest['isConflictGroupInImmediateConflictResolutionMode'](
          Configurator.GroupType.CONFLICT_GROUP,
          false
        )
      ).toBe(false);
    });

    it('should return true in case group type is ConflictGroup and immediateConflictResolution is set to true', () => {
      expect(
        classUnderTest['isConflictGroupInImmediateConflictResolutionMode'](
          Configurator.GroupType.CONFLICT_GROUP,
          true
        )
      ).toBe(true);
    });
  });
});
