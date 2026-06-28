/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.control.MenuButton
 *  javafx.scene.control.MenuItem
 */
package de.hhn.seb.labsw.laspoly.model.card.preview;

import de.hhn.seb.labsw.laspoly.model.card.preview.ActionMenuProvider;
import de.hhn.seb.labsw.laspoly.view.paint.PreviewDrawable;
import java.util.List;
import java.util.function.Function;
import javafx.scene.control.MenuButton;
import javafx.scene.control.MenuItem;

public interface ActionMenuDrawable
extends PreviewDrawable {
    public void consumeMenuActions(List<MenuItem> var1, Function<ActionMenuDrawable, ActionMenuProvider> var2);

    public MenuButton getMenuButton();
}

