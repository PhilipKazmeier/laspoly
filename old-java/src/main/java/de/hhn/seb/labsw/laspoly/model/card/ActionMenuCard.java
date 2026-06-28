/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.event.EventHandler
 *  javafx.scene.control.MenuButton
 *  javafx.scene.control.MenuItem
 */
package de.hhn.seb.labsw.laspoly.model.card;

import de.hhn.seb.labsw.laspoly.model.card.Card;
import de.hhn.seb.labsw.laspoly.model.card.preview.ActionMenuDrawable;
import de.hhn.seb.labsw.laspoly.model.card.preview.ActionMenuProvider;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import java.util.HashMap;
import java.util.List;
import java.util.ResourceBundle;
import java.util.function.Function;
import javafx.event.EventHandler;
import javafx.scene.control.MenuButton;
import javafx.scene.control.MenuItem;

public abstract class ActionMenuCard
extends Card
implements ActionMenuDrawable {
    private MenuButton actionButton;

    @Override
    public final void consumeMenuActions(List<MenuItem> items, Function<ActionMenuDrawable, ActionMenuProvider> invalidateFunc) {
        this.actionButton.getItems().clear();
        this.actionButton.getItems().addAll(items);
        HashMap oldListeners = new HashMap(items.size());
        items.forEach(item -> oldListeners.put(item, item.getOnAction()));
        items.forEach(item -> item.setOnAction(ev -> {
            if (oldListeners.containsKey(item)) {
                ((EventHandler)oldListeners.get(item)).handle(ev);
            }
            this.drawPreview();
            ActionMenuProvider prov = (ActionMenuProvider)invalidateFunc.apply(this);
            this.getMenuButton().setVisible(prov.isActionMenuVisible());
            this.consumeMenuActions(prov.getMenuItems(), invalidateFunc);
        }));
    }

    @Override
    public final MenuButton getMenuButton() {
        return this.actionButton;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "actionButton=" + this.actionButton + '}';
    }

    public class NodeHolder
    extends Card.NodeHolder {
        public NodeHolder(FXMLFile resFile) {
            super(resFile);
            ActionMenuCard.this.actionButton = (MenuButton)this.getLayout().lookup("#actionmenubutton");
        }

        @Override
        protected void updateLabelTexts(ResourceBundle res) {
            ActionMenuCard.this.actionButton.setText(res.getString("carddescription_actionbutton_name"));
        }

        @Override
        protected int[] getLabelsFromInterest() {
            return new int[0];
        }

        @Override
        public String toString() {
            return this.getClass().getName() + "{}";
        }
    }
}

