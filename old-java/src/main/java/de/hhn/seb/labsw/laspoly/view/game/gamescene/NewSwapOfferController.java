/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.collections.FXCollections
 *  javafx.collections.ObservableList
 *  javafx.fxml.FXML
 *  javafx.fxml.FXMLLoader
 *  javafx.fxml.Initializable
 *  javafx.scene.Cursor
 *  javafx.scene.Node
 *  javafx.scene.control.Button
 *  javafx.scene.control.ComboBox
 *  javafx.scene.control.Hyperlink
 *  javafx.scene.control.Label
 *  javafx.scene.control.ListView
 *  javafx.scene.control.Tab
 *  javafx.scene.control.TabPane
 *  javafx.scene.control.TextField
 *  javafx.scene.layout.AnchorPane
 */
package de.hhn.seb.labsw.laspoly.view.game.gamescene;

import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.SwapOfferAction;
import de.hhn.seb.labsw.laspoly.model.field.FieldConfiguration;
import de.hhn.seb.labsw.laspoly.model.field.Property;
import de.hhn.seb.labsw.laspoly.model.field.Street;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.utils.dataloading.ResourceBundleSource;
import de.hhn.seb.labsw.laspoly.view.game.GameController;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.GameScene;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.PropertyCardCellRenderer;
import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.ResourceBundle;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.fxml.Initializable;
import javafx.scene.Cursor;
import javafx.scene.Node;
import javafx.scene.control.Button;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Hyperlink;
import javafx.scene.control.Label;
import javafx.scene.control.ListView;
import javafx.scene.control.Tab;
import javafx.scene.control.TabPane;
import javafx.scene.control.TextField;
import javafx.scene.layout.AnchorPane;

public class NewSwapOfferController
implements Initializable {
    private SwapOfferAction action;
    @FXML
    private Label tab0title;
    @FXML
    private Label tab0subtitle;
    @FXML
    private Label tab1subtitle;
    @FXML
    private Label tab1title;
    @FXML
    private Label tab2title;
    @FXML
    private Label tab2subtitle;
    @FXML
    private ComboBox<String> tab0playercombobox;
    @FXML
    private Hyperlink tab0offerselectedlink;
    @FXML
    private Hyperlink tab0wantedselectedlink;
    @FXML
    private TextField tab0wantedmoneyfield;
    @FXML
    private TextField tab0offermoneyfield;
    @FXML
    private Button cancelButton;
    @FXML
    private Button makeOfferButton;
    @FXML
    private Button editButton;
    @FXML
    private Tab tab0;
    @FXML
    private Tab tab1;
    @FXML
    private Tab tab2;
    @FXML
    private ListView<Property> tab2receiverlistview;
    @FXML
    private ListView<Property> tab1senderlistview;
    @FXML
    private Label tab0partnerlabel;
    @FXML
    private Label tab0diffvaluelabel;
    @FXML
    private Label tab0offeredvalluelabel;
    @FXML
    private Label tab0offermoneylabel;
    @FXML
    private Label tab0wantedlabels;
    @FXML
    private Label tab0wantedvaluelabl;
    @FXML
    private Label tab0wantedmoneylabel;
    @FXML
    private Label tab0difflabel;
    @FXML
    private Label tab0offeringlabel;
    @FXML
    private AnchorPane rootPane;
    @FXML
    private TabPane tabpane;
    private ObservableList<Property> clientSelProps;
    private ObservableList<Property> opponentSelProps;
    private List<Player> receivers;
    private ResourceBundle res;
    private GameController controller;

    public static NewSwapOfferController newInstance(Class caller) {
        FXMLLoader loader = new FXMLLoader(caller.getResource(FXMLFile.SWAP_PANE.source()));
        try {
            loader.load();
            return (NewSwapOfferController)loader.getController();
        }
        catch (IOException e) {
            e.printStackTrace();
            return new NewSwapOfferController();
        }
    }

    public final void initialize(URL location, ResourceBundle resources) {
        this.res = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.SWAP_OFFER, GameScene.getResources().getLocale());
        this.clientSelProps = FXCollections.observableArrayList();
        this.opponentSelProps = FXCollections.observableArrayList();
        this.clientSelProps.addListener((javafx.collections.ListChangeListener<? super de.hhn.seb.labsw.laspoly.model.field.Property>) c -> this.updateTab0());
        this.opponentSelProps.addListener((javafx.collections.ListChangeListener<? super de.hhn.seb.labsw.laspoly.model.field.Property>) c -> this.updateTab0());
        this.tab1senderlistview.setOnMousePressed(e -> this.tab1senderlistview.getSelectionModel().clearSelection());
        this.tab2receiverlistview.setOnMousePressed(e -> this.tab2receiverlistview.getSelectionModel().clearSelection());
        this.tab0playercombobox.setOnAction(e -> this.onComboboxSelection());
        this.tab0offermoneyfield.setOnKeyPressed(e -> this.onFieldTextChanged());
        this.tab0wantedmoneyfield.setOnKeyPressed(e -> this.onFieldTextChanged());
        this.tab0offermoneyfield.setOnKeyReleased(e -> this.onFieldTextChanged());
        this.tab0wantedmoneyfield.setOnKeyReleased(e -> this.onFieldTextChanged());
        this.tab0offermoneyfield.focusedProperty().addListener(e -> this.onFieldTextChanged());
        this.tab0wantedmoneyfield.focusedProperty().addListener(e -> this.onFieldTextChanged());
        this.tab0wantedmoneyfield.setOnKeyPressed(e -> this.onFieldTextChanged());
        this.tab0offerselectedlink.setOnAction(e -> this.tabpane.getSelectionModel().select(this.tab1));
        this.tab0wantedselectedlink.setOnAction(e -> this.tabpane.getSelectionModel().select(this.tab2));
        this.cancelButton.setGraphic((Node)GameImage.CROSS.toButtonGraphic());
        this.cancelButton.setCursor(Cursor.HAND);
        this.editButton.setGraphic((Node)GameImage.EDIT.toButtonGraphic());
        this.editButton.setCursor(Cursor.HAND);
        this.editButton.setOnAction(e -> this.onEdit());
        this.makeOfferButton.setGraphic((Node)GameImage.EXCHANGE.toButtonGraphic());
        this.makeOfferButton.setCursor(Cursor.HAND);
        this.updateAllTexts();
    }

    private void onFieldTextChanged() {
        if (this.tab0wantedmoneyfield.getText().contains("-") || this.tab0offermoneyfield.getText().contains("-")) {
            this.tab0wantedmoneyfield.setText(this.tab0wantedmoneyfield.getText().replace("-", ""));
            this.tab0offermoneyfield.setText(this.tab0offermoneyfield.getText().replace("-", ""));
        }
        int clientMoney = 0;
        int opponentMoney = 0;
        try {
            clientMoney = Integer.parseInt(this.tab0offermoneyfield.getText());
        }
        catch (NumberFormatException numberFormatException) {
            // empty catch block
        }
        try {
            opponentMoney = Integer.parseInt(this.tab0wantedmoneyfield.getText());
        }
        catch (NumberFormatException numberFormatException) {
            // empty catch block
        }
        this.setActionMoneyValues(clientMoney, opponentMoney);
        this.updateTab0();
    }

    private void updateAllTexts() {
        this.cancelButton.setText(this.res.getString("cancel"));
        this.makeOfferButton.setText(this.res.getString("makeoffer"));
        this.editButton.setText(this.res.getString("editoffer"));
        this.tab0.setText(this.res.getString("tab0header"));
        this.tab1.setText(this.res.getString("tab1header"));
        this.tab2.setText(this.res.getString("tab2header"));
        this.tab0title.setText(this.res.getString("tab0title"));
        this.tab1title.setText(this.res.getString("tab1title"));
        this.tab2title.setText(this.res.getString("tab2title"));
        this.tab0subtitle.setText(this.res.getString("tab0subtitle"));
        this.tab1subtitle.setText(this.res.getString("tab1subtitle"));
        this.tab2subtitle.setText(this.res.getString("tab2subtitle"));
        this.tab0partnerlabel.setText(this.res.getString("tab0partnerlabel"));
        this.tab0offeringlabel.setText(this.res.getString("tab0offeringlabel"));
        this.tab0wantedlabels.setText(this.res.getString("tab0wishedlabel"));
        this.tab0offermoneylabel.setText(this.res.getString("tab0offermoneylabel"));
        this.tab0wantedmoneylabel.setText(this.res.getString("tab0wishedmoneylabel"));
        this.tab0difflabel.setText(this.res.getString("tab0difflabel"));
        this.tab0offerselectedlink.setText("");
        this.tab0wantedselectedlink.setText("");
        this.tab0offeredvalluelabel.setText("");
        this.tab0wantedvaluelabl.setText("");
        this.tab0diffvaluelabel.setText("");
        if (this.action != null && this.isModeReceiving() && !this.isModeEditing()) {
            this.overrideReceivingTexts();
        }
    }

    private void overrideReceivingTexts() {
        this.tab1.setText(this.res.getString("tab1recheader"));
        this.tab2.setText(this.res.getString("tab2recheader"));
        this.cancelButton.setText(this.res.getString("denyoffer"));
        this.makeOfferButton.setText(this.res.getString("acceptoffer"));
        this.tab0title.setText(this.res.getString("tab0rectitle"));
        this.tab0subtitle.setText(this.res.getString("tab0recsubtitle"));
        this.tab1subtitle.setText(this.res.getString("tab1recsubtitle"));
        this.tab2subtitle.setText(this.res.getString("tab2recsubtitle"));
        this.tab0offeringlabel.setText(this.res.getString("tab0recofferinglabel"));
        this.tab0wantedlabels.setText(this.res.getString("tab0recdesiredlabel"));
        this.tab0offermoneylabel.setText(this.res.getString("tab0recoffermoneylabel"));
        this.tab0wantedmoneylabel.setText(this.res.getString("tab0recwishedmoneylabel"));
    }

    private void updateTab0() {
        String textSelectedCardsSender = this.res.getString("tab0offerselectedlink");
        String textSelectedCardsReceiver = this.res.getString("tab0wishedselectedlink");
        if (this.isModeReceiving()) {
            this.tab0playercombobox.setVisible(false);
            textSelectedCardsSender = this.res.getString("tab0recofferselectedlink");
            textSelectedCardsReceiver = this.res.getString("tab0recofferselectedlink");
            String partner = this.res.getString("tab0recpartnerlabel");
            int num1 = this.isModeEditing() ? this.clientSelProps.size() : this.tab1senderlistview.getItems().size();
            int num2 = this.isModeEditing() ? this.opponentSelProps.size() : this.tab2receiverlistview.getItems().size();
            partner = this.clientIsSender() ? String.format(partner, this.action.getReceiver().getName()) : String.format(partner, this.action.getSender().getName());
            textSelectedCardsSender = String.format(textSelectedCardsSender, num1);
            textSelectedCardsReceiver = String.format(textSelectedCardsReceiver, num2);
            this.tab0partnerlabel.setText(partner);
        } else {
            textSelectedCardsSender = String.format(textSelectedCardsSender, this.clientSelProps.size());
            textSelectedCardsReceiver = String.format(textSelectedCardsReceiver, this.opponentSelProps.size());
            this.tab0playercombobox.setVisible(true);
        }
        this.tab0offerselectedlink.setText(textSelectedCardsSender);
        this.tab0wantedselectedlink.setText(textSelectedCardsReceiver);
        int clientValue = 0;
        int opponValue = 0;
        for (Property prop : this.clientSelProps) {
            if (prop.isMortgaged()) {
                clientValue += prop.getPriceInfo().getRent(1);
                continue;
            }
            clientValue += prop.getPrice();
        }
        for (Property prop : this.opponentSelProps) {
            if (prop.isMortgaged()) {
                opponValue += prop.getPriceInfo().getRent(1);
                continue;
            }
            opponValue += prop.getPrice();
        }
        int diffVal1 = 0;
        int diffVal2 = 0;
        switch (this.action.getStatus()) {
            case OPEN: 
            case CHANGED_BY_RECEIVER: 
            case EDITING_BY_SENDER: 
            case EDITING_BY_RECEIVER: {
                diffVal1 = this.action.getSenderMoney();
                diffVal2 = this.action.getReceiverMoney();
                break;
            }
            case SENT: 
            case CHANGED_BY_SENDER: {
                diffVal1 = this.action.getReceiverMoney();
                diffVal2 = this.action.getSenderMoney();
            }
        }
        int diff = Math.abs(diffVal1 + clientValue - diffVal2 - opponValue);
        this.tab0offeredvalluelabel.setText(String.valueOf(clientValue));
        this.tab0wantedvaluelabl.setText(String.valueOf(opponValue));
        this.tab0diffvaluelabel.setText(String.valueOf(diff));
    }

    private boolean clientIsSender() {
        return this.controller.getClientPlayer().getUser().equals(this.action.getSender());
    }

    private void populatePropsList(ListView<Property> listView, ObservableList<Property> preSelection, List<Property> scope) {
        scope.removeIf(prop -> prop instanceof Street && !((Street)prop).getBuildings().isEmpty());
        listView.setItems(FXCollections.observableArrayList(scope));
        listView.setCellFactory(list -> this.newRenderer(preSelection));
    }

    private PropertyCardCellRenderer newRenderer(ObservableList<Property> preSelection) {
        PropertyCardCellRenderer renderer = new PropertyCardCellRenderer((List<Property>)preSelection, this.isModeEditing() || this.isModeOpen(), false);
        renderer.preventLoadingFromFile(true);
        return renderer;
    }

    private void populateCombobox() {
        ArrayList<String> comboboxModel = new ArrayList<String>(this.receivers.size());
        for (Player rec : this.receivers) {
            comboboxModel.add(rec.getName());
        }
        this.tab0playercombobox.setItems(FXCollections.observableArrayList(comboboxModel));
        if (comboboxModel.size() == 1) {
            this.tab0playercombobox.getSelectionModel().select(0);
            this.onComboboxSelection();
        }
    }

    public void importAction(Player receivingPlayer, GameController contr) {
        System.out.println("importing receiver ");
        if (this.action != null) {
            throw new IllegalStateException("action already assigned");
        }
        this.action = new SwapOfferAction(contr.getClientPlayer().getUser(), contr.getClientPlayer().getUser(), receivingPlayer.getUser());
        this.editButton.setVisible(false);
        this.controller = contr;
        this.receivers = new ArrayList<Player>(contr.getPlayers());
        this.receivers.removeIf(pl -> pl.equals(contr.getClientPlayer()));
        this.populateCombobox();
        this.tab0playercombobox.getSelectionModel().select(this.receivers.indexOf(receivingPlayer));
        this.populatePropsList(this.tab1senderlistview, this.clientSelProps, new ArrayList<Property>(contr.getClientPlayer().getPropertyList()));
        this.populatePropsList(this.tab2receiverlistview, this.opponentSelProps, new ArrayList<Property>(receivingPlayer.getPropertyList()));
        this.updateTab0();
    }

    public void importAction(SwapOfferAction swapOfferAction, GameController contr) {
        System.out.println("importing action " + swapOfferAction);
        this.controller = contr;
        this.action = swapOfferAction;
        this.editButton.setVisible(true);
        List senderProps = Stream.of(FieldConfiguration.getProperties()).filter(prop -> swapOfferAction.getSenderProperties().contains(prop.getPosition())).collect(Collectors.toList());
        List recProps = Stream.of(FieldConfiguration.getProperties()).filter(prop -> swapOfferAction.getReceiverProperties().contains(prop.getPosition())).collect(Collectors.toList());
        switch (this.action.getStatus()) {
            case SENT: 
            case CHANGED_BY_SENDER: {
                this.clientSelProps.addAll(recProps);
                this.opponentSelProps.addAll(senderProps);
                this.tab0offermoneyfield.setText(this.action.getReceiverMoney() + "");
                this.tab0wantedmoneyfield.setText(this.action.getSenderMoney() + "");
                break;
            }
            case CHANGED_BY_RECEIVER: {
                this.clientSelProps.addAll(senderProps);
                this.opponentSelProps.addAll(recProps);
                this.tab0offermoneyfield.setText(this.action.getReceiverMoney() + "");
                this.tab0wantedmoneyfield.setText(this.action.getSenderMoney() + "");
            }
        }
        this.populatePropsList(this.tab1senderlistview, this.clientSelProps, (List<Property>)this.clientSelProps);
        this.populatePropsList(this.tab2receiverlistview, this.opponentSelProps, (List<Property>)this.opponentSelProps);
        Player receiver = this.controller.getPlayer(this.action.getReceiver());
        this.receivers = Collections.singletonList(receiver);
        this.populateCombobox();
        this.overrideReceivingTexts();
        this.tab0offermoneyfield.setDisable(true);
        this.tab0wantedmoneyfield.setDisable(true);
        this.updateTab0();
    }

    public void importAction(Property preselection, GameController contr) {
        System.out.println("importing rpeselection");
        if (this.action != null) {
            throw new IllegalStateException("action already assigned");
        }
        this.editButton.setVisible(false);
        this.action = new SwapOfferAction(contr.getClientPlayer().getUser(), contr.getClientPlayer().getUser(), null);
        this.controller = contr;
        this.receivers = new ArrayList<Player>(contr.getPlayers());
        this.receivers.removeIf(pl -> pl.equals(contr.getClientPlayer()));
        this.populateCombobox();
        Player preselectionOwner = preselection.getOwner();
        if (preselectionOwner.equals(contr.getClientPlayer())) {
            this.clientSelProps.add(preselection);
            this.tabpane.getSelectionModel().select(this.tab1);
        } else {
            this.tab0playercombobox.getSelectionModel().select(this.receivers.indexOf(preselectionOwner));
            this.opponentSelProps.add(preselection);
            this.tabpane.getSelectionModel().select(this.tab2);
        }
        this.populatePropsList(this.tab1senderlistview, this.clientSelProps, new ArrayList<Property>(contr.getClientPlayer().getPropertyList()));
        this.populateOpponentPropsList();
        this.updateTab0();
    }

    private void populateOpponentPropsList() {
        int selInd = this.tab0playercombobox.getSelectionModel().getSelectedIndex();
        if (selInd == -1) {
            if (this.receivers.isEmpty()) {
                return;
            }
            this.tab0playercombobox.getSelectionModel().select(0);
            selInd = 0;
        }
        User receiverUser = this.receivers.get(selInd).getUser();
        if (this.isModeOpen() && !receiverUser.equals(this.action.getReceiver())) {
            this.action.setReceiver(receiverUser);
        }
        this.populatePropsList(this.tab2receiverlistview, this.opponentSelProps, new ArrayList<Property>(this.controller.getPlayer(receiverUser).getPropertyList()));
    }

    private void onComboboxSelection() {
        int selInd = this.tab0playercombobox.getSelectionModel().getSelectedIndex();
        if (selInd == -1) {
            return;
        }
        User newReceiver = this.receivers.get(selInd).getUser();
        if (newReceiver.equals(this.action.getReceiver())) {
            return;
        }
        if (this.isModeOpen()) {
            this.action.setReceiver(newReceiver);
        }
        this.opponentSelProps.clear();
        this.updateTab0();
        this.populateOpponentPropsList();
    }

    public SwapOfferAction exportAction() {
        if (this.clientIsSender() || this.isModeOpen()) {
            this.action.setSenderProperties(this.getClientSelectedPropertiesPositions());
            this.action.setReceiverProperties(this.getOpponentSelectedPropertiesPositions());
        } else {
            this.action.setSenderProperties(this.getOpponentSelectedPropertiesPositions());
            this.action.setReceiverProperties(this.getClientSelectedPropertiesPositions());
        }
        System.out.println("exporting action " + this.action);
        return this.action;
    }

    public final void setOnCancelListener(Runnable onCancelListener) {
        this.cancelButton.setOnAction(e -> onCancelListener.run());
    }

    public final void setOnDoneListener(Runnable onDoneListener) {
        this.makeOfferButton.setOnAction(e -> onDoneListener.run());
    }

    public final void onEdit() {
        System.out.println("before editing action " + this.action);
        this.populatePropsList(this.tab1senderlistview, this.clientSelProps, new ArrayList<Property>(this.controller.getClientPlayer().getPropertyList()));
        if (this.clientIsSender()) {
            this.populatePropsList(this.tab2receiverlistview, this.opponentSelProps, new ArrayList<Property>(this.controller.getPlayer(this.action.getReceiver()).getPropertyList()));
        } else {
            this.populatePropsList(this.tab2receiverlistview, this.opponentSelProps, new ArrayList<Property>(this.controller.getPlayer(this.action.getSender()).getPropertyList()));
        }
        switch (this.action.getStatus()) {
            case SENT: 
            case CHANGED_BY_SENDER: {
                this.action.setStatus(SwapOfferAction.Status.EDITING_BY_RECEIVER);
                break;
            }
            case CHANGED_BY_RECEIVER: {
                this.action.setStatus(SwapOfferAction.Status.EDITING_BY_SENDER);
            }
        }
        this.updateAllTexts();
        this.updateTab0();
        this.onFieldTextChanged();
        this.makeOfferButton.setText(this.res.getString("sendCounterOffer"));
        this.tab0offermoneyfield.setDisable(false);
        this.tab0wantedmoneyfield.setDisable(false);
        this.editButton.setVisible(false);
        System.out.println("editing action " + this.action);
    }

    public final AnchorPane getRootPane() {
        return this.rootPane;
    }

    private boolean isModeReceiving() {
        return this.action.getStatus() == SwapOfferAction.Status.CHANGED_BY_SENDER || this.action.getStatus() == SwapOfferAction.Status.CHANGED_BY_RECEIVER || this.action.getStatus() == SwapOfferAction.Status.EDITING_BY_RECEIVER || this.action.getStatus() == SwapOfferAction.Status.EDITING_BY_SENDER || this.action.getStatus() == SwapOfferAction.Status.SENT;
    }

    private boolean isSelectingCardsEnabled() {
        return this.isModeEditing() || this.action.getStatus() == SwapOfferAction.Status.OPEN;
    }

    private boolean isModeEditing() {
        return this.action.getStatus() == SwapOfferAction.Status.EDITING_BY_RECEIVER || this.action.getStatus() == SwapOfferAction.Status.EDITING_BY_SENDER;
    }

    private boolean isModeOpen() {
        return this.action.getStatus() == SwapOfferAction.Status.OPEN;
    }

    private void setActionMoneyValues(int client, int opponent) {
        this.action.setSenderMoney(client);
        this.action.setReceiverMoney(opponent);
    }

    public final int[] getOpponentSelectedPropertiesPositions() {
        int[] selPropInd = new int[this.opponentSelProps.size()];
        for (int i = 0; i < selPropInd.length; ++i) {
            selPropInd[i] = ((Property)this.opponentSelProps.get(i)).getPosition();
        }
        return selPropInd;
    }

    public final int[] getClientSelectedPropertiesPositions() {
        int[] selPropInd = new int[this.clientSelProps.size()];
        for (int i = 0; i < selPropInd.length; ++i) {
            selPropInd[i] = ((Property)this.clientSelProps.get(i)).getPosition();
        }
        return selPropInd;
    }

    public String toString() {
        StringBuffer sb = new StringBuffer("de.hhn.seb.labsw.laspoly.view.game.gamescene.SwapOfferController{");
        sb.append("opponentSelProps=").append(this.opponentSelProps);
        sb.append(", clientSelProps=").append(this.clientSelProps);
        sb.append(", action=").append(this.action);
        sb.append('}');
        return sb.toString();
    }
}

