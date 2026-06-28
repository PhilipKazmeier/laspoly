/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.fxml.FXML
 *  javafx.fxml.Initializable
 *  javafx.scene.Node
 *  javafx.scene.control.ComboBox
 *  javafx.scene.control.Label
 *  javafx.scene.control.ListCell
 *  javafx.scene.control.TextField
 */
package de.hhn.seb.labsw.laspoly.debug;

import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.action.BuildingConstructionAction;
import de.hhn.seb.labsw.laspoly.model.action.KnockDownBuildingAction;
import de.hhn.seb.labsw.laspoly.model.action.PropertyBoughtAction;
import de.hhn.seb.labsw.laspoly.model.action.TransactionAction;
import de.hhn.seb.labsw.laspoly.model.building.Factory;
import de.hhn.seb.labsw.laspoly.model.building.Hotel;
import de.hhn.seb.labsw.laspoly.model.building.House;
import de.hhn.seb.labsw.laspoly.model.field.Field;
import de.hhn.seb.labsw.laspoly.model.field.Property;
import de.hhn.seb.labsw.laspoly.model.field.Street;
import de.hhn.seb.labsw.laspoly.view.game.GameController;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.parts.DiceCup;
import java.net.URL;
import java.util.ResourceBundle;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.Node;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.ListCell;
import javafx.scene.control.TextField;

public class GameDebuggerController
implements Initializable {
    @FXML
    private TextField rollField1;
    @FXML
    private TextField rollField2;
    @FXML
    private ComboBox<Player> playerComboBox;
    @FXML
    private ComboBox<Field> fieldComboBox;
    @FXML
    private TextField moneyAmount;
    @FXML
    private ComboBox<String> possibleBuildings;
    @FXML
    private Label errorLabel;
    private GameController gameController;

    public void initialize(URL location, ResourceBundle resources) {
        this.playerComboBox.setCellFactory(param -> new ListCell<Player>(){

            protected void updateItem(Player item, boolean empty) {
                super.updateItem(item, empty);
                if (!empty) {
                    Label label = new Label(item.getName());
                    this.setGraphic((Node)label);
                }
            }
        });
        this.playerComboBox.setButtonCell((ListCell)new ListCell<Player>(){

            protected void updateItem(Player item, boolean empty) {
                super.updateItem(item, empty);
                if (!empty) {
                    Label label = new Label(item.getName());
                    this.setGraphic((Node)label);
                }
            }
        });
        this.fieldComboBox.setCellFactory(param -> new ListCell<Field>(){

            protected void updateItem(Field item, boolean empty) {
                super.updateItem(item, empty);
                if (!empty) {
                    Label label = new Label("(" + item.getPosition() + ") " + item.getName());
                    this.setGraphic((Node)label);
                }
            }
        });
        this.fieldComboBox.setButtonCell((ListCell)new ListCell<Field>(){

            protected void updateItem(Field item, boolean empty) {
                super.updateItem(item, empty);
                if (!empty) {
                    Label label = new Label("(" + item.getPosition() + ") " + item.getName());
                    this.setGraphic((Node)label);
                }
            }
        });
        this.possibleBuildings.getItems().addAll(new String[]{"House", "Hotel", "Factory"});
    }

    @FXML
    public void addMoney() {
        try {
            if (this.playerComboBox.getSelectionModel().getSelectedItem() != null) {
                int money = Integer.parseInt(this.moneyAmount.getText());
                Player player = (Player)this.playerComboBox.getSelectionModel().getSelectedItem();
                player.addMoney(money);
                this.gameController.addAction(new TransactionAction(player.getUser(), money, true, this.gameController.getClientPlayer().getUser()));
            }
        }
        catch (Exception e) {
            e.printStackTrace();
        }
    }

    @FXML
    public void removeMoney() {
        try {
            if (this.playerComboBox.getSelectionModel().getSelectedItem() != null) {
                int money = Integer.parseInt(this.moneyAmount.getText());
                Player player = (Player)this.playerComboBox.getSelectionModel().getSelectedItem();
                if (!player.removeMoney(money)) {
                    this.showErrorMessage("Can not remove that much money.");
                    return;
                }
                this.gameController.addAction(new TransactionAction(player.getUser(), money, false, this.gameController.getClientPlayer().getUser()));
            }
        }
        catch (Exception e) {
            this.showErrorMessage(e.getMessage());
        }
    }

    @FXML
    public void addProperty() {
        try {
            if (this.playerComboBox.getSelectionModel().getSelectedItem() != null && this.fieldComboBox.getSelectionModel().getSelectedItem() != null) {
                Field selected = (Field)this.fieldComboBox.getSelectionModel().getSelectedItem();
                Player player = (Player)this.playerComboBox.getSelectionModel().getSelectedItem();
                if (selected instanceof Property) {
                    Property prop = (Property)selected;
                    if (prop.getOwner() == null) {
                        player.add(prop);
                        prop.setOwner(player);
                        PropertyBoughtAction action = new PropertyBoughtAction(prop, player.getUser(), this.gameController.getClientPlayer().getUser());
                        this.gameController.addAction(action);
                    }
                } else {
                    this.showErrorMessage("This field can not be bought.");
                }
            }
        }
        catch (Exception e) {
            this.showErrorMessage(e.getMessage());
        }
    }

    @FXML
    public void addBuilding() {
        try {
            if (this.possibleBuildings.getSelectionModel().getSelectedItem() != null && this.fieldComboBox.getSelectionModel().getSelectedItem() != null) {
                String selected = (String)this.possibleBuildings.getSelectionModel().getSelectedItem();
                Field field = (Field)this.fieldComboBox.getSelectionModel().getSelectedItem();
                if (field instanceof Street && ((Street)field).getOwner() != null) {
                    Street str = (Street)field;
                    switch (selected) {
                        case "House": {
                            str.construct(new House());
                            BuildingConstructionAction action = new BuildingConstructionAction(str.getOwner().getUser(), str.getPosition(), BuildingConstructionAction.BuildingType.HOUSE, this.gameController.getClientPlayer().getUser());
                            this.gameController.addAction(action);
                            break;
                        }
                        case "Hotel": {
                            str.construct(new Hotel());
                            BuildingConstructionAction action2 = new BuildingConstructionAction(str.getOwner().getUser(), str.getPosition(), BuildingConstructionAction.BuildingType.HOTEL, this.gameController.getClientPlayer().getUser());
                            this.gameController.addAction(action2);
                            break;
                        }
                        case "Factory": {
                            str.construct(new Factory());
                            BuildingConstructionAction action3 = new BuildingConstructionAction(str.getOwner().getUser(), str.getPosition(), BuildingConstructionAction.BuildingType.FACTORY, this.gameController.getClientPlayer().getUser());
                            this.gameController.addAction(action3);
                            break;
                        }
                    }
                }
            }
        }
        catch (Exception e) {
            this.showErrorMessage(e.getMessage());
        }
    }

    @FXML
    public void removeBuilding() {
        try {
            Field field;
            if (this.possibleBuildings.getSelectionModel().getSelectedItem() != null && this.fieldComboBox.getSelectionModel().getSelectedItem() != null && (field = (Field)this.fieldComboBox.getSelectionModel().getSelectedItem()) instanceof Street && ((Street)field).getOwner() != null) {
                Street str = (Street)field;
                str.knockDownBuilding();
                KnockDownBuildingAction action = new KnockDownBuildingAction(str.getOwner().getUser(), str.getPosition(), this.gameController.getClientPlayer().getUser());
                this.gameController.addAction(action);
            }
        }
        catch (Exception e) {
            this.showErrorMessage(e.getMessage());
        }
    }

    private void showErrorMessage(String error) {
        this.errorLabel.setText(error);
    }

    public void setGameController(GameController controller) {
        this.gameController = controller;
        this.playerComboBox.getItems().addAll(controller.getPlayers());
        this.fieldComboBox.getItems().addAll(this.gameController.getScene().getFields());
    }

    @FXML
    public void applyDiceRoll() {
        int roll1 = Integer.parseInt(this.rollField1.getText());
        int roll2 = Integer.parseInt(this.rollField2.getText());
        if (roll1 > 0 && roll1 <= 6 && roll2 > 0 && roll2 <= 6) {
            DiceCup.setNextRolledNumbers(new int[]{roll1, roll2});
        } else {
            this.showErrorMessage("Not possible");
        }
    }

    @FXML
    public void moveTo() {
        this.showErrorMessage("This feature is not implemented");
    }
}

