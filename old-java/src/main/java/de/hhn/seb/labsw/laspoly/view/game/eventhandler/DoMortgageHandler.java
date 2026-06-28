/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.event.ActionEvent
 *  javafx.event.EventHandler
 */
package de.hhn.seb.labsw.laspoly.view.game.eventhandler;

import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.action.KnockDownBuildingAction;
import de.hhn.seb.labsw.laspoly.model.action.MortgageAction;
import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.model.building.Building;
import de.hhn.seb.labsw.laspoly.model.building.Factory;
import de.hhn.seb.labsw.laspoly.model.building.Hotel;
import de.hhn.seb.labsw.laspoly.model.building.House;
import de.hhn.seb.labsw.laspoly.model.field.Property;
import de.hhn.seb.labsw.laspoly.model.field.Street;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import java.util.List;
import javafx.event.ActionEvent;
import javafx.event.EventHandler;

public class DoMortgageHandler
implements EventHandler<ActionEvent> {
    private final GameHandler handler;
    private final Player owner;
    private final Property property;

    public DoMortgageHandler(GameHandler gameHandler, Player propOwner, Property prop) {
        this.handler = gameHandler;
        this.owner = propOwner;
        this.property = prop;
    }

    public void handle(ActionEvent event) {
        if (this.owner == null) {
            return;
        }
        if (this.property instanceof Street && !((Street)this.property).getBuildings().isEmpty()) {
            this.handler.getScene().showMortgageDialog(this::doMortgaging);
        } else {
            this.doMortgaging();
        }
    }

    private void doMortgaging() {
        this.owner.addMoney(this.property.getPriceInfo().getRent(1));
        this.property.setMortgaged(true);
        this.handler.addAction(new TransactionAction(this.owner.getUser(), this.property.getPriceInfo().getRent(1), true, this.handler.getClientPlayer().getUser()));
        this.handler.addAction(new MortgageAction(this.handler.getClientPlayer().getUser(), this.property.getPosition(), true));
        if (this.property instanceof Street) {
            Building[] buildings;
            Street str = (Street)this.property;
            List<Building> buildingList = str.getBuildings();
            for (Building building : buildings = buildingList.toArray(new Building[buildingList.size()])) {
                str.knockDownBuilding();
                this.handler.addAction(new KnockDownBuildingAction(this.handler.getClientPlayer().getUser(), str.getPosition(), this.handler.getClientPlayer().getUser()));
                if (building instanceof House) {
                    this.owner.addMoney(str.getPriceInfo().getRent(1));
                    this.handler.addAction(new TransactionAction(this.owner.getUser(), str.getPriceInfo().getRent(1), true, this.owner.getUser()));
                    continue;
                }
                if (building instanceof Hotel) {
                    this.owner.addMoney(str.getPriceInfo().getRent(1));
                    this.handler.addAction(new TransactionAction(this.owner.getUser(), str.getPriceInfo().getRent(1), true, this.owner.getUser()));
                    for (int i = 0; i < 4; ++i) {
                        this.owner.addMoney(str.getPriceInfo().getRent(1));
                        this.handler.addAction(new TransactionAction(this.owner.getUser(), str.getPriceInfo().getRent(1), true, this.owner.getUser()));
                        str.knockDownBuilding();
                        this.handler.addAction(new KnockDownBuildingAction(this.handler.getClientPlayer().getUser(), str.getPosition(), this.handler.getClientPlayer().getUser()));
                    }
                    continue;
                }
                if (!(building instanceof Factory)) continue;
                this.owner.addMoney(str.getPriceInfo().getRent(2));
                this.handler.addAction(new TransactionAction(this.owner.getUser(), str.getPriceInfo().getRent(2), true, this.owner.getUser()));
            }
        }
    }
}

