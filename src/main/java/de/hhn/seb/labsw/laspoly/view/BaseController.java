/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.view;

import de.hhn.seb.labsw.laspoly.view.MainWindowController;

public interface BaseController {
    public void updateLanguage();

    public void onUpdate();

    public void stopUpdate();

    public MainWindowController getMainWindowController();

    public void setMainWindowController(MainWindowController var1);

    public void closeProgram();
}

