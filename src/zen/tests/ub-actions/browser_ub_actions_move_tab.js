/* Any copyright is dedicated to the Public Domain.
   https://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

ChromeUtils.defineESModuleGetters(this, {
  UrlbarTestUtils: "resource://testing-common/UrlbarTestUtils.sys.mjs",
});

UrlbarTestUtils.init(this);

add_task(async function test_Ub_Actions_Move_Tab_To_Space() {
  const originalWorkspaceId = gZenWorkspaces.activeWorkspace;
  const workspaceName = "zen-urlbar-move-tab-target-3c91e2";

  await gZenWorkspaces.createAndSaveWorkspace(workspaceName);
  const targetWorkspace = gZenWorkspaces
    .getWorkspaces()
    .find(workspace => workspace.name == workspaceName);
  ok(targetWorkspace, "Created the target space");

  registerCleanupFunction(async function () {
    if (UrlbarTestUtils.isPopupOpen(window)) {
      await UrlbarTestUtils.promisePopupClose(window, () =>
        EventUtils.synthesizeKey("KEY_Escape")
      );
    }
    if (gZenWorkspaces.activeWorkspace != originalWorkspaceId) {
      await gZenWorkspaces.changeWorkspace(originalWorkspaceId);
    }
    if (
      gZenWorkspaces
        .getWorkspaces()
        .some(workspace => workspace.uuid == targetWorkspace.uuid)
    ) {
      await gZenWorkspaces.removeWorkspace(targetWorkspace.uuid);
    }
  });

  await gZenWorkspaces.changeWorkspace(originalWorkspaceId);
  const tab = await BrowserTestUtils.openNewForegroundTab(
    gBrowser,
    "https://example.com"
  );

  await UrlbarTestUtils.promiseAutocompleteResultPopup({
    window,
    waitForFocus,
    value: "Move Tab to " + workspaceName,
  });

  let moveResultIndex = -1;
  const resultCount = UrlbarTestUtils.getResultCount(window);
  for (let i = 0; i < resultCount; i++) {
    const { result } = await UrlbarTestUtils.getDetailsOfResultAt(window, i);
    if (result.payload.moveTabToWorkspaceId == targetWorkspace.uuid) {
      moveResultIndex = i;
      break;
    }
  }
  Assert.greater(
    moveResultIndex,
    -1,
    "The move action for the target space should be shown"
  );

  UrlbarTestUtils.setSelectedRowIndex(window, moveResultIndex);
  EventUtils.synthesizeKey("KEY_Enter");

  await TestUtils.waitForCondition(
    () => gZenWorkspaces.activeWorkspace == targetWorkspace.uuid,
    "Waiting to follow the tab into the target space"
  );
  Assert.equal(
    tab.getAttribute("zen-workspace-id"),
    targetWorkspace.uuid,
    "The tab should now belong to the target space"
  );
  Assert.equal(
    gBrowser.selectedTab,
    tab,
    "The moved tab should be selected in the target space"
  );

  BrowserTestUtils.removeTab(tab);
});
