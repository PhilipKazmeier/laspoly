/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.event.ActionEvent
 *  javafx.event.EventHandler
 */
package de.hhn.seb.labsw.laspoly.view.game.eventhandler;

import de.hhn.seb.labsw.laspoly.System;
import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.action.MessageAction;
import de.hhn.seb.labsw.laspoly.model.action.MortgageAction;
import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.model.field.Property;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import javafx.event.ActionEvent;
import javafx.event.EventHandler;

public class UndoMortgageHandler
implements EventHandler<ActionEvent> {
    private final GameHandler handler;
    private final Player owner;
    private final Property property;

    public UndoMortgageHandler(GameHandler gameHandler, Player propOwner, Property prop) {
        this.handler = gameHandler;
        this.owner = propOwner;
        this.property = prop;
    }

    public void handle(ActionEvent event) {
        if (this.owner != null && this.owner.removeMoney((int)((double)this.property.getPriceInfo().getRent(1) * 1.1))) {
            this.property.setMortgaged(false);
            this.handler.addAction(new TransactionAction(this.owner.getUser(), (int)((double)this.property.getPriceInfo().getRent(1) * 1.1), false, this.handler.getClientPlayer().getUser()));
            this.handler.addAction(new MortgageAction(this.handler.getClientPlayer().getUser(), this.property.getPosition(), false));
        } else {
            MessageAction messageAction = new MessageAction(System.SYSTEM_USER, this.handler.getBundle().getString("notEnoughMoneyMortgage"), System.SYSTEM_USER);
            this.handler.addChatMessage(messageAction);
        }
    }
}

