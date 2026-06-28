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
import de.hhn.seb.labsw.laspoly.model.action.KnockDownBuildingAction;
import de.hhn.seb.labsw.laspoly.model.action.MessageAction;
import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.model.building.Building;
import de.hhn.seb.labsw.laspoly.model.building.Factory;
import de.hhn.seb.labsw.laspoly.model.building.Hotel;
import de.hhn.seb.labsw.laspoly.model.building.House;
import de.hhn.seb.labsw.laspoly.model.field.Street;
import de.hhn.seb.labsw.laspoly.utils.audio.Sound;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import java.util.List;
import javafx.event.ActionEvent;
import javafx.event.EventHandler;

public class SellBuildingHandler
implements EventHandler<ActionEvent> {
    private final GameHandler handler;
    private final Player owner;
    private final Street str;

    public SellBuildingHandler(GameHandler gameHandler, Player propOwner, Street street) {
        this.handler = gameHandler;
        this.owner = propOwner;
        this.str = street;
    }

    public void handle(ActionEvent event) {
        List<Building> buildingList = this.str.getBuildings();
        if (!buildingList.isEmpty()) {
            Building building = buildingList.get(buildingList.size() - 1);
            this.str.knockDownBuilding();
            Sound.SELL.play();
            this.handler.addAction(new KnockDownBuildingAction(this.handler.getClientPlayer().getUser(), this.str.getPosition(), this.handler.getClientPlayer().getUser()));
            if (building instanceof House) {
                this.owner.addMoney(this.str.getPriceInfo().getRent(1));
                this.handler.addAction(new TransactionAction(this.owner.getUser(), this.str.getPriceInfo().getRent(1), true, this.owner.getUser()));
                this.handler.addChatMessage(new MessageAction(System.SYSTEM_USER, this.handler.getBundle().getString("youSoldHouse"), System.SYSTEM_USER));
            } else if (building instanceof Hotel) {
                this.owner.addMoney(this.str.getPriceInfo().getRent(1));
                this.handler.addAction(new TransactionAction(this.owner.getUser(), this.str.getPriceInfo().getRent(1), true, this.owner.getUser()));
                this.handler.addChatMessage(new MessageAction(System.SYSTEM_USER, this.handler.getBundle().getString("youSoldHotel"), System.SYSTEM_USER));
            } else if (building instanceof Factory) {
                this.owner.addMoney(this.str.getPriceInfo().getRent(2));
                this.handler.addAction(new TransactionAction(this.owner.getUser(), this.str.getPriceInfo().getRent(2), true, this.owner.getUser()));
                this.handler.addChatMessage(new MessageAction(System.SYSTEM_USER, this.handler.getBundle().getString("youSoldFactory"), System.SYSTEM_USER));
            }
        }
    }
}

