/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.event.ActionEvent
 *  javafx.event.EventHandler
 */
package de.hhn.seb.labsw.laspoly.view.game.eventhandler;

import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.action.PropertySoldAction;
import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.model.field.Property;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import javafx.event.ActionEvent;
import javafx.event.EventHandler;

public class SellPropertyHandler
implements EventHandler<ActionEvent> {
    private GameHandler handler;
    private Property property;

    public SellPropertyHandler(GameHandler gameHandler, Property prop) {
        this.handler = gameHandler;
        this.property = prop;
    }

    public void handle(ActionEvent event) {
        PropertySoldAction action = new PropertySoldAction(this.handler.getClientPlayer().getUser(), this.property);
        this.handler.addAction(action);
        Player player = this.property.getOwner();
        TransactionAction transaction = new TransactionAction(player.getUser(), this.property.getPrice() / 2, true, this.handler.getClientPlayer().getUser());
        this.handler.addAction(transaction);
        player.addMoney(this.property.getPrice() / 2);
        player.remove(this.property);
        this.property.setOwner(null);
        if (this.handler.getScene().showsListOfProps()) {
            this.handler.getScene().hideListOfProps();
        }
    }
}

