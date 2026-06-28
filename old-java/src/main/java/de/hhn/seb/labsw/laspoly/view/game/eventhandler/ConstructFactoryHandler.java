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
import de.hhn.seb.labsw.laspoly.model.action.BuildingConstructionAction;
import de.hhn.seb.labsw.laspoly.model.action.MessageAction;
import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.model.building.Factory;
import de.hhn.seb.labsw.laspoly.model.field.Street;
import de.hhn.seb.labsw.laspoly.utils.audio.Sound;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import javafx.event.ActionEvent;
import javafx.event.EventHandler;

public class ConstructFactoryHandler
implements EventHandler<ActionEvent> {
    private final GameHandler handler;
    private final Player owner;
    private final Street str;

    public ConstructFactoryHandler(GameHandler gameHandler, Player propOwner, Street street) {
        this.handler = gameHandler;
        this.owner = propOwner;
        this.str = street;
    }

    public void handle(ActionEvent event) {
        if (this.owner != null && this.owner.removeMoney(this.str.getPriceInfo().getRent(4))) {
            this.str.construct(new Factory());
            this.handler.addAction(new TransactionAction(this.owner.getUser(), this.str.getPriceInfo().getRent(4), false, this.handler.getClientPlayer().getUser()));
            this.handler.addAction(new BuildingConstructionAction(this.owner.getUser(), this.str.getPosition(), BuildingConstructionAction.BuildingType.FACTORY, this.handler.getClientPlayer().getUser()));
            this.handler.addChatMessage(new MessageAction(System.SYSTEM_USER, String.format(this.handler.getBundle().getString("constructedFactoryMsg"), this.handler.getClientPlayer().getUser().getName(), this.str.getName()), System.SYSTEM_USER));
            Sound.CONSTRUCTION.play();
        } else {
            MessageAction messageAction = new MessageAction(System.SYSTEM_USER, this.handler.getBundle().getString("notEnoughMoneyConstructFactory"), System.SYSTEM_USER);
            this.handler.addChatMessage(messageAction);
        }
    }
}

