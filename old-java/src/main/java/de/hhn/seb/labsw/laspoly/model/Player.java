/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.beans.InvalidationListener
 *  javafx.beans.property.IntegerProperty
 *  javafx.beans.property.ReadOnlyIntegerProperty
 *  javafx.beans.property.SimpleIntegerProperty
 *  javafx.collections.FXCollections
 *  javafx.collections.ObservableList
 *  javafx.scene.paint.Color
 */
package de.hhn.seb.labsw.laspoly.model;

import de.hhn.seb.labsw.laspoly.model.Transactable;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.building.Factory;
import de.hhn.seb.labsw.laspoly.model.building.Hotel;
import de.hhn.seb.labsw.laspoly.model.building.House;
import de.hhn.seb.labsw.laspoly.model.card.preview.PlayerPreviewCard;
import de.hhn.seb.labsw.laspoly.model.field.Property;
import de.hhn.seb.labsw.laspoly.model.field.Street;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.PreviewManager;
import de.hhn.seb.labsw.laspoly.view.paint.PreviewDrawable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.logging.Logger;
import javafx.beans.InvalidationListener;
import javafx.beans.property.IntegerProperty;
import javafx.beans.property.ReadOnlyIntegerProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.scene.paint.Color;

public class Player
implements Transactable,
PreviewDrawable {
    private final User user;
    private final IntegerProperty capital;
    private final ObservableList<Property> propertyList;
    private final int[] lastRoll = new int[]{-1, -1};
    private final Logger logger;
    private Figure figure;
    private int prisonCounter;
    private int prisonRollCounter;
    private int doubleCounter;
    private boolean casinoRoll = false;
    private PlayerPreviewCard previewCard;
    private Color color;

    public Player(User playerUser) {
        this.user = playerUser;
        this.logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/view/view_logging.properties");
        this.propertyList = FXCollections.observableList(new ArrayList());
        this.capital = new SimpleIntegerProperty(1300);
        this.previewCard = new PlayerPreviewCard(this);
    }

    public void chooseFigure(Figure playerFigure, Color playerColor) {
        this.figure = playerFigure;
        this.figure.setOnMouseHover(isHoverStarting -> PreviewManager.showPreview(this.previewCard));
        this.color = playerColor;
    }

    public Figure getFigure() {
        return this.figure;
    }

    public List<Property> getPropertyList() {
        return Collections.unmodifiableList(this.propertyList);
    }

    public void add(Property property) {
        this.propertyList.add(property);
    }

    public void remove(Property property) {
        this.propertyList.remove(property);
    }

    public void clear() {
        this.propertyList.clear();
    }

    public void addOnPropertyListChangeListener(InvalidationListener listener) {
        this.propertyList.addListener(listener);
    }

    public int[] getLastRoll() {
        return new int[]{this.lastRoll[0], this.lastRoll[1]};
    }

    public User getUser() {
        return this.user;
    }

    public void setLastRoll(int roll1, int roll2) {
        this.lastRoll[0] = roll1;
        this.lastRoll[1] = roll2;
    }

    public void incrementDoubleCounter() {
        ++this.doubleCounter;
    }

    public void resetDoubleCounter() {
        this.doubleCounter = 0;
    }

    public int getDoubleCounter() {
        return this.doubleCounter;
    }

    public int getPrisonCounter() {
        return this.prisonCounter;
    }

    public void setPrisonCounter(int counter) {
        this.prisonCounter = counter;
    }

    @Override
    public void addMoney(int amount) {
        this.capital.setValue((Number)(this.capital.intValue() + amount));
        this.logger.info("Added " + amount + " to " + this.getUser().getName());
        this.logger.info("New value is: " + this.capital.intValue());
    }

    @Override
    public boolean removeMoney(int amount) {
        if (!this.enoughMoney(amount)) {
            this.logger.info("Not enough money of the player.");
            return false;
        }
        this.capital.setValue((Number)(this.capital.getValue() - amount));
        this.logger.info("Removed " + amount + " from " + this.getUser().getName());
        this.logger.info("New value is: " + this.capital.intValue());
        return true;
    }

    @Override
    public int getMoneyAmount() {
        return this.capital.intValue();
    }

    public ReadOnlyIntegerProperty getCapital() {
        return this.capital;
    }

    public IntegerProperty capitalProperty() {
        return this.capital;
    }

    @Override
    public String getName() {
        return this.user.getName();
    }

    public IntegerProperty getCapitalProperty() {
        return this.capital;
    }

    public void decrementPrisonCounter() {
        --this.prisonCounter;
    }

    public void incrementPrisonRollCounter() {
        ++this.prisonRollCounter;
    }

    public int getPrisonRollCounter() {
        return this.prisonRollCounter;
    }

    public void resetPrisonRollCounter() {
        this.prisonRollCounter = 0;
    }

    public boolean isCasinoRoll() {
        return this.casinoRoll;
    }

    public void setCasinoRoll(boolean b) {
        this.casinoRoll = b;
    }

    public Collection<House> getAllHouses() {
        ArrayList<House> houses = new ArrayList<House>();
        this.propertyList.forEach(property -> {
            if (property instanceof Street) {
                Street street = (Street)property;
                street.getBuildings().forEach(building -> {
                    if (building instanceof House) {
                        houses.add((House)building);
                    }
                });
            }
        });
        return houses;
    }

    public Collection<Hotel> getAllHotels() {
        ArrayList<Hotel> hotels = new ArrayList<Hotel>();
        this.propertyList.forEach(property -> {
            if (property instanceof Street) {
                Street street = (Street)property;
                street.getBuildings().forEach(building -> {
                    if (building instanceof Hotel) {
                        hotels.add((Hotel)building);
                    }
                });
            }
        });
        return hotels;
    }

    public Collection<Factory> getAllFactories() {
        ArrayList<Factory> factories = new ArrayList<Factory>();
        this.propertyList.forEach(property -> {
            if (property instanceof Street) {
                Street street = (Street)property;
                street.getBuildings().forEach(building -> {
                    if (building instanceof Factory) {
                        factories.add((Factory)building);
                    }
                });
            }
        });
        return factories;
    }

    @Override
    public EnhancedGroup drawPreview() {
        return this.previewCard.drawPreview();
    }

    public Color getColor() {
        return this.color;
    }
}

