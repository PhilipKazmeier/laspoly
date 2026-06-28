/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.scene.Group
 *  javafx.scene.Node
 *  javafx.scene.image.ImageView
 *  javafx.scene.layout.AnchorPane
 */
package de.hhn.seb.labsw.laspoly.model.field;

import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.model.card.Card;
import de.hhn.seb.labsw.laspoly.model.card.preview.TrainStationPreviewCard;
import de.hhn.seb.labsw.laspoly.model.field.FieldGroup;
import de.hhn.seb.labsw.laspoly.model.field.Property;
import de.hhn.seb.labsw.laspoly.model.figure.Figure;
import de.hhn.seb.labsw.laspoly.model.priceinfo.PriceInfo;
import de.hhn.seb.labsw.laspoly.model.priceinfo.TrainStationPriceInfo;
import de.hhn.seb.labsw.laspoly.utils.EnhancedGroup;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.view.game.GameHandler;
import javafx.scene.Group;
import javafx.scene.Node;
import javafx.scene.image.ImageView;
import javafx.scene.layout.AnchorPane;

public class TrainStation
extends Property {
    public static final TrainStationPriceInfo PRICE_INFO = new TrainStationPriceInfo();
    private final NodeHolder nodes = new NodeHolder();
    private final TrainStationPreviewCard previewCard = new TrainStationPreviewCard(this);
    private FieldGroup group;

    public TrainStation(int pos, String name) {
        super(pos, name);
    }

    @Override
    public int getPrice() {
        return PRICE_INFO.getRent(0);
    }

    @Override
    public Group draw() {
        Group graphicsGroup = super.draw(80.0);
        graphicsGroup.getChildren().add(this.nodes.imageGroup);
        return graphicsGroup;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "nodes=" + this.nodes + ", previewCard=" + this.previewCard + ", group=" + this.group + '}';
    }

    @Override
    public PriceInfo getPriceInfo() {
        return PRICE_INFO;
    }

    @Override
    public Card getPreviewCard() {
        return this.previewCard;
    }

    @Override
    public Card createNewPreviewCard() {
        return new TrainStationPreviewCard(this);
    }

    @Override
    public void onFigureEntered(Figure fig, GameHandler handler) {
        Player currentPlayer = handler.getPlayer(fig.getUser());
        if (this.getOwner() == null) {
            handler.showPurchaseDialog(this);
        } else if (!this.isMortgaged() && !this.getOwner().equals(currentPlayer)) {
            int rent = 0;
            switch (this.getFieldGroup().getOwnersPropsCount(this.getOwner())) {
                case 1: {
                    rent = PRICE_INFO.getRent(5);
                    break;
                }
                case 2: {
                    rent = PRICE_INFO.getRent(6);
                    break;
                }
                case 3: {
                    rent = PRICE_INFO.getRent(7);
                    break;
                }
                case 4: {
                    rent = PRICE_INFO.getRent(8);
                    break;
                }
            }
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

    @Override
    public FieldGroup getFieldGroup() {
        return this.group;
    }

    @Override
    public void setFieldGroup(FieldGroup colourGroup) {
        this.group = colourGroup;
    }

    public class NodeHolder
    extends Property.NodeHolder {
        private final EnhancedGroup imageGroup = new EnhancedGroup();

        public NodeHolder() {
            ImageView imgV = new ImageView(DataLoader.getInstance().getGameImage(GameImage.IC_TRAIN_STATION));
            imgV.setFitHeight(64.0);
            imgV.setFitWidth(64.0);
            AnchorPane pane = this.getTextPane();
            pane.getChildren().clear();
            pane.getChildren().add(imgV);
            AnchorPane.setLeftAnchor((Node)imgV, (Double)18.0);
            AnchorPane.setRightAnchor((Node)imgV, (Double)18.0);
            AnchorPane.setTopAnchor((Node)imgV, (Double)10.0);
            this.imageGroup.getChildren().addAll(new Node[]{pane});
            this.imageGroup.setRz(180.0);
            this.imageGroup.setRx(270.0);
            this.imageGroup.setTy(11.0);
            this.imageGroup.setTx(50.0);
            this.imageGroup.setTz(75.0);
        }

        @Override
        public String toString() {
            return this.getClass().getName() + "{" + "imageGroup=" + this.imageGroup + '}';
        }
    }
}

