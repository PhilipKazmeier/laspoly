/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.Group
 *  javafx.scene.Node
 *  javafx.scene.paint.Color
 *  javafx.scene.paint.Material
 *  javafx.scene.paint.PhongMaterial
 *  javafx.scene.shape.Box
 */
package de.hhn.seb.labsw.laspoly.model.field;

import de.hhn.seb.labsw.laspoly.exception.BuildingConstructionException;
import de.hhn.seb.labsw.laspoly.exception.InvalidParameterException;
import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.action.BuildingConstructionAction;
import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.model.building.Building;
import de.hhn.seb.labsw.laspoly.model.building.Factory;
import de.hhn.seb.labsw.laspoly.model.building.Hotel;
import de.hhn.seb.labsw.laspoly.model.building.House;
import de.hhn.seb.labsw.laspoly.model.card.Card;
import de.hhn.seb.labsw.laspoly.model.card.preview.StreetPreviewCard;
import de.hhn.seb.labsw.laspoly.model.field.FieldGroup;
import de.hhn.seb.labsw.laspoly.model.field.Property;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.model.priceinfo.StreetPriceInfo;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.LoggerFactory;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.logging.Logger;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.paint.Color;
import javafx.scene.paint.Material;
import javafx.scene.paint.PhongMaterial;
import javafx.scene.shape.Box;

public class Street
extends Property {
    private final Color color;
    private final StreetPriceInfo rents;
    private final NodeHolder nodes;
    private final List<Building> buildings;
    private final StreetPreviewCard previewCard;
    private final Logger logger = LoggerFactory.initializeLogger(this.getClass(), "de/hhn/seb/labsw/laspoly/view/game/gamescene/gamescene_logging.properties");
    private FieldGroup colourGroup;

    public Street(int fieldPos, String name, Color streetColor, StreetPriceInfo priceInfo) {
        super(fieldPos, name);
        this.color = streetColor;
        this.rents = priceInfo;
        this.buildings = new ArrayList<Building>();
        this.nodes = new NodeHolder();
        this.previewCard = new StreetPreviewCard(this);
    }

    @Override
    public int getPrice() {
        return this.rents.getRent(0);
    }

    @Override
    public Group draw() {
        Group graphicsGroup = super.draw();
        this.nodes.buildingsGroup.getChildren().clear();
        for (int i = 0; i < this.buildings.size(); ++i) {
            Building building = this.buildings.get(i);
            Node drawing = building.draw();
            double spaceLeft = 100.0 - 23.0 * (double)this.buildings.size();
            double margin = spaceLeft / (double)this.buildings.size() / 2.0;
            double translateX = (double)i * 23.0 + (double)(i + 1) * margin;
            if (this.buildings.size() < 4 && this.buildings.size() > 1) {
                translateX += 5.75;
            }
            drawing.setTranslateX(-translateX);
            this.nodes.buildingsGroup.getChildren().add(drawing);
        }
        this.nodes.buildingsGroup.setTranslateZ(56.0);
        this.nodes.buildingsGroup.setTranslateX(38.5);
        graphicsGroup.getChildren().addAll(new Node[]{this.nodes.colorBar, this.nodes.buildingsGroup});
        return graphicsGroup;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append("de.hhn.seb.labsw.laspoly.model.field.Street{");
        sb.append("buildings=");
        for (Building b : this.buildings) {
            sb.append(", ");
            sb.append(b.getClass().getName());
        }
        sb.append(", color=");
        sb.append(this.color);
        sb.append(", nodes=");
        sb.append(this.nodes);
        sb.append(", colourGroup=");
        sb.append(this.colourGroup);
        sb.append('}');
        return sb.toString();
    }

    @Override
    public StreetPriceInfo getPriceInfo() {
        return this.rents;
    }

    @Override
    public Card getPreviewCard() {
        return this.previewCard;
    }

    @Override
    public Card createNewPreviewCard() {
        this.logger.info("Creating a new preview from file");
        return new StreetPreviewCard(this);
    }

    @Override
    protected void onHoverStart() {
        super.onHoverStart();
        this.nodes.colorBar.setMaterial((Material)this.nodes.colorBarMaterialHover);
    }

    @Override
    protected void onHoverEnd() {
        super.onHoverEnd();
        this.nodes.colorBar.setMaterial((Material)this.nodes.colorBarMaterial);
    }

    @Override
    public void onFigureEntered(Figure fig, GameHandler handler) {
        Player currentPlayer = handler.getPlayer(fig.getUser());
        if (this.getOwner() == null) {
            handler.showPurchaseDialog(this);
        } else if (this.getOwner().equals(currentPlayer) && !this.isMortgaged() && !this.buildings.isEmpty() && this.getBuildings().get(0) instanceof Factory) {
            currentPlayer.addMoney(this.getPriceInfo().getRent(5));
            TransactionAction transactionAdd = new TransactionAction(currentPlayer.getUser(), this.getPriceInfo().getRent(5), true, handler.getClientPlayer().getUser());
            handler.addAction(transactionAdd);
        } else if (this.getOwner() != null && !this.getOwner().equals(currentPlayer) && !this.isMortgaged()) {
            int rent = 0;
            switch (this.getBuildings().size()) {
                case 0: {
                    if (this.getFieldGroup().ownsAllProps(this.getOwner())) {
                        rent = this.getPriceInfo().getRent(6);
                        rent *= 2;
                        break;
                    }
                    rent = this.getPriceInfo().getRent(6);
                    break;
                }
                case 1: {
                    if (this.getBuildings().get(0) instanceof Hotel) {
                        rent = this.getPriceInfo().getRent(11);
                        break;
                    }
                    if (!(this.getBuildings().get(0) instanceof House)) break;
                    rent = this.getPriceInfo().getRent(7);
                    break;
                }
                case 2: {
                    rent = this.getPriceInfo().getRent(8);
                    break;
                }
                case 3: {
                    rent = this.getPriceInfo().getRent(9);
                    break;
                }
                case 4: {
                    rent = this.getPriceInfo().getRent(10);
                    break;
                }
            }
            if (rent != 0) {
                if (currentPlayer.removeMoney(rent)) {
                    TransactionAction transactionRemove = new TransactionAction(currentPlayer.getUser(), rent, false, handler.getClientPlayer().getUser());
                    handler.addAction(transactionRemove);
                    this.getOwner().addMoney(rent);
                    TransactionAction transactionAdd = new TransactionAction(this.getOwner().getUser(), rent, true, handler.getClientPlayer().getUser());
                    handler.addAction(transactionAdd);
                } else {
                    handler.kickPlayer(fig.getUser(), "lostNoMoneyLeft");
                }
            }
        }
    }

    public List<Building> getBuildings() {
        return Collections.unmodifiableList(this.buildings);
    }

    public Color getColor() {
        return this.color;
    }

    @Override
    public FieldGroup getFieldGroup() {
        return this.colourGroup;
    }

    @Override
    public void setFieldGroup(FieldGroup group) {
        this.colourGroup = group;
    }

    /*
     * Enabled force condition propagation
     * Lifted jumps to return sites
     */
    public void construct(Building building) {
        if (building == null) {
            throw new InvalidParameterException("Constructed building may not be null.", "building", null);
        }
        if (this.getOwner() == null) {
            throw new InvalidParameterException("Street should be sold.", "owner", "null");
        }
        if (this.buildings.contains(building)) {
            throw new InvalidParameterException("Building should not be constructed twice.", "building", building);
        }
        if (building instanceof House) {
            if (!this.canConstructHouse(false) && !this.isMortgaged()) throw new BuildingConstructionException(this.buildings, "A house could not be built.");
            this.buildings.add(building);
            this.draw();
        } else if (building instanceof Hotel) {
            if (!this.canConstructHotel(false)) throw new BuildingConstructionException(this.buildings, "A hotel could not be built.");
            this.buildings.clear();
            this.buildings.add(building);
        } else {
            if (!(building instanceof Factory)) throw new InvalidParameterException("No valid building was given.", "building", building);
            if (!this.canConstructFactory(false)) throw new BuildingConstructionException(this.buildings, "A factory could not be built.");
            this.buildings.clear();
            this.buildings.add(building);
        }
        this.draw();
    }

    public void syncBuildingFromNetwork(BuildingConstructionAction.BuildingType type) {
        switch (type) {
            case HOUSE: {
                this.buildings.add(new House());
                break;
            }
            case HOTEL: {
                this.buildings.clear();
                this.buildings.add(new Hotel());
                break;
            }
            case FACTORY: {
                this.buildings.clear();
                this.buildings.add(new Factory());
                break;
            }
        }
        this.draw();
    }

    public void knockDownBuilding() {
        if (this.buildings.isEmpty()) {
            throw new IllegalStateException("No building to knock down");
        }
        Building b = this.buildings.get(this.buildings.size() - 1);
        this.buildings.remove(b);
        if (b instanceof Hotel && this.getOwner() != null) {
            this.construct(new House());
            this.construct(new House());
            this.construct(new House());
            this.construct(new House());
        }
        this.draw();
    }

    public boolean canConstructHouse() {
        return this.canConstructHouse(true);
    }

    private boolean canConstructHouse(boolean checkFieldGroup) {
        int buildingCount = this.buildings.size();
        boolean hasHotelOrFactory = buildingCount > 0 && (this.buildings.get(0) instanceof Hotel || this.buildings.get(0) instanceof Factory);
        boolean groupComplete = this.getFieldGroup().ownsAllProps(this.getOwner());
        boolean[] evenlyBuilt = new boolean[]{true};
        boolean[] propHasFactory = new boolean[]{false};
        if (checkFieldGroup) {
            this.getFieldGroup().getGroupedProperties().stream().filter(property -> property instanceof Street && property != this).forEach(property -> {
                Street street = (Street)property;
                int size = street.getBuildings().size();
                if (size - buildingCount == -1) {
                    evenlyBuilt[0] = false;
                }
                if (size > 0 && street.getBuildings().get(0) instanceof Factory) {
                    propHasFactory[0] = true;
                }
            });
        }
        return groupComplete && buildingCount < 4 && !hasHotelOrFactory && evenlyBuilt[0] && !propHasFactory[0];
    }

    public boolean canConstructHotel() {
        return this.canConstructHotel(true);
    }

    private boolean canConstructHotel(boolean checkFieldGroup) {
        boolean[] evenlyBuilt = new boolean[]{true};
        if (checkFieldGroup) {
            this.getFieldGroup().getGroupedProperties().stream().filter(property -> property instanceof Street && property != this).forEach(property -> {
                Street street = (Street)property;
                int size = street.getBuildings().size();
                if (size == 2 || size == 3 || size == 1 && !(street.getBuildings().get(0) instanceof Hotel)) {
                    evenlyBuilt[0] = false;
                }
            });
        }
        return this.buildings.size() == 4 && evenlyBuilt[0];
    }

    public boolean canConstructFactory() {
        return this.canConstructFactory(true);
    }

    public boolean canConstructFactory(boolean checkFieldGroup) {
        boolean groupComplete = this.getFieldGroup().ownsAllProps(this.getOwner());
        boolean[] evenlyBuilt = new boolean[]{true};
        if (checkFieldGroup) {
            this.getFieldGroup().getGroupedProperties().stream().filter(property -> property instanceof Street && property != this).forEach(property -> {
                int size = ((Street)property).getBuildings().size();
                if (!(size == 0 || size == 1 && ((Street)property).getBuildings().get(0) instanceof Factory)) {
                    evenlyBuilt[0] = false;
                }
            });
        }
        return groupComplete && this.buildings.isEmpty() && evenlyBuilt[0];
    }

    public boolean canSellHouse() {
        int buildingCount = this.buildings.size();
        boolean[] evenlyBuilt = new boolean[]{true};
        this.getFieldGroup().getGroupedProperties().stream().filter(property -> property instanceof Street && property != this).forEach(property -> {
            Street street = (Street)property;
            int size = street.getBuildings().size();
            if (size - buildingCount == 1) {
                evenlyBuilt[0] = false;
            } else if (size != 0 && buildingCount == 4 && street.getBuildings().get(0) instanceof Hotel) {
                evenlyBuilt[0] = false;
            }
        });
        return evenlyBuilt[0];
    }

    public boolean canSellHotel() {
        return true;
    }

    public boolean canSellFactory() {
        return true;
    }

    public class NodeHolder
    extends Property.NodeHolder {
        private final EnhancedGroup buildingsGroup = new EnhancedGroup();
        private final Box colorBar = new Box(100.0, 5.0, 37.5);
        private final PhongMaterial colorBarMaterial;
        private final PhongMaterial colorBarMaterialHover;

        public NodeHolder() {
            this.colorBar.setTranslateY(this.getBottomHeight() + 2.5);
            this.colorBar.setTranslateZ(56.25);
            Street.this.registerMouseCallbacks((Node)this.colorBar);
            this.colorBarMaterial = de.hhn.seb.labsw.laspoly.view.paint.Material.colored(Street.this.color);
            this.colorBarMaterialHover = new de.hhn.seb.labsw.laspoly.view.paint.Material(Street.this.color.darker());
            this.colorBar.setMaterial((Material)this.colorBarMaterial);
        }

        @Override
        public String toString() {
            return this.getClass().getName() + "{" + "buildingsGroup=" + this.buildingsGroup + ", colorBar=" + this.colorBar + ", colorBarMaterial=" + this.colorBarMaterial + ", colorBarMaterialHover=" + this.colorBarMaterialHover + '}';
        }
    }
}

