/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.event.ActionEvent
 *  javafx.event.EventHandler
 *  javafx.scene.control.MenuItem
 */
package de.hhn.seb.labsw.laspoly.model.card.preview;

import de.hhn.seb.labsw.laspoly.exception.InvalidParameterException;
import java.util.ArrayList;
import java.util.List;
import java.util.ResourceBundle;
import java.util.stream.IntStream;
import java.util.stream.Stream;
import javafx.event.ActionEvent;
import javafx.event.EventHandler;
import javafx.scene.control.MenuItem;

public class ActionMenuProvider {
    private final ResourceBundle resources;
    private ArrayList<MenuItem> menuItems;
    private boolean menuVisible;

    public ActionMenuProvider(ResourceBundle res, String ... identifiers) {
        this.resources = res;
        this.setItemTexts(identifiers);
    }

    public List<MenuItem> getMenuItems() {
        return this.menuItems;
    }

    @SafeVarargs
    public final void setItemListeners(EventHandler<ActionEvent> ... eventHandlers) {
        if (eventHandlers.length != this.menuItems.size()) {
            throw new InvalidParameterException("Size of listeners should match size of items.", "eventHandlers", eventHandlers.length);
        }
        IntStream.range(0, eventHandlers.length).forEach(index -> this.menuItems.get(index).setOnAction(eventHandlers[index]));
    }

    public boolean isActionMenuVisible() {
        return this.menuVisible;
    }

    public void setActionMenuVisible() {
        this.menuVisible = true;
    }

    public void setItemsVisible(boolean ... visible) {
        if (visible.length != this.menuItems.size()) {
            throw new InvalidParameterException("Size of listeners should match size of items.", "visible", visible.length);
        }
        for (int i = 0; i < this.menuItems.size(); ++i) {
            this.menuItems.get(i).setVisible(visible[i]);
            if (!visible[i]) continue;
            this.setActionMenuVisible();
        }
    }

    public void setItemTexts(String ... identifiers) {
        this.menuItems = new ArrayList(identifiers.length);
        Stream.of(identifiers).forEach(id -> this.menuItems.add(new MenuItem(this.resources.getString((String)id))));
    }

    public String toString() {
        return this.getClass().getName() + "{" + "resources=" + this.resources + ", menuItems=" + this.menuItems + ", menuVisible=" + this.menuVisible + '}';
    }
}

