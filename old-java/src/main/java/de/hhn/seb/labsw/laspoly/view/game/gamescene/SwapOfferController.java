/*
 * Decompiled with CFR 0.152.
 * 
 * Could not load the following classes:
 *  javafx.collections.FXCollections
 *  javafx.collections.ObservableList
 *  javafx.event.EventHandler
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
 *  javafx.scene.image.ImageView
 *  javafx.scene.layout.AnchorPane
 */
package de.hhn.seb.labsw.laspoly.view.game.gamescene;

import de.hhn.seb.labsw.laspoly.model.Player;
import de.hhn.seb.labsw.laspoly.model.action.SwapOfferAction;
import de.hhn.seb.labsw.laspoly.model.field.Property;
import de.hhn.seb.labsw.laspoly.model.field.Street;
import de.hhn.seb.labsw.laspoly.utils.dataloading.DataLoader;
import de.hhn.seb.labsw.laspoly.utils.dataloading.FXMLFile;
import de.hhn.seb.labsw.laspoly.utils.dataloading.GameImage;
import de.hhn.seb.labsw.laspoly.utils.dataloading.ResourceBundleSource;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.GameScene;
import de.hhn.seb.labsw.laspoly.view.game.gamescene.PropertyCardCellRenderer;
import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.ResourceBundle;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.event.EventHandler;
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
import javafx.scene.image.ImageView;
import javafx.scene.layout.AnchorPane;

public class SwapOfferController
implements Initializable {
    private SwapOfferAction attachment;
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
    private Player sender;
    private Player receiver;
    private ObservableList<Property> senderSelectedProperties;
    private ObservableList<Property> receiverSelectedProperties;
    private int senderMoney = 0;
    private int receiverMoney = 0;
    private List<Player> otherPlayers;
    private ResourceBundle res;
    private boolean isModeReceiving;

    public static SwapOfferController newInstance(Class caller) {
        FXMLLoader loader = new FXMLLoader(caller.getResource(FXMLFile.SWAP_PANE.source()));
        try {
            loader.load();
            return (SwapOfferController)loader.getController();
        }
        catch (IOException e) {
            e.printStackTrace();
            return new SwapOfferController();
        }
    }

    public void attach(SwapOfferAction attach) {
        this.attachment = attach;
    }

    public SwapOfferAction getAttachedAction() {
        if (this.attachment == null) {
            this.attachment = new SwapOfferAction(this.sender.getUser(), this.sender.getUser(), this.receiver.getUser());
        }
        switch (this.attachment.getStatus()) {
            case EDITING_BY_RECEIVER: {
                this.attachment.setReceiverMoney(this.getSenderMoney());
                this.attachment.setSenderMoney(this.getReceiverMoney());
                this.attachment.setReceiverProperties(this.getSenderSelectedPropertiesPositions());
                this.attachment.setSenderProperties(this.getReceiverSelectedPropertiesPositions());
                break;
            }
            case EDITING_BY_SENDER: 
            case OPEN: {
                this.attachment.setReceiverMoney(this.getReceiverMoney());
                this.attachment.setSenderMoney(this.getSenderMoney());
                this.attachment.setReceiverProperties(this.getReceiverSelectedPropertiesPositions());
                this.attachment.setSenderProperties(this.getSenderSelectedPropertiesPositions());
            }
        }
        return this.attachment;
    }

    public final void initialize(URL location, ResourceBundle resources) {
        this.res = DataLoader.getInstance().getResourceBundle(ResourceBundleSource.SWAP_OFFER, GameScene.getResources().getLocale());
        this.senderSelectedProperties = FXCollections.observableArrayList();
        this.receiverSelectedProperties = FXCollections.observableArrayList();
        this.senderSelectedProperties.addListener((javafx.collections.ListChangeListener<? super de.hhn.seb.labsw.laspoly.model.field.Property>) c -> this.updateTab0());
        this.receiverSelectedProperties.addListener((javafx.collections.ListChangeListener<? super de.hhn.seb.labsw.laspoly.model.field.Property>) c -> this.updateTab0());
        this.tab1senderlistview.setOnMousePressed(e -> this.tab1senderlistview.getSelectionModel().clearSelection());
        this.tab2receiverlistview.setOnMousePressed(e -> this.tab2receiverlistview.getSelectionModel().clearSelection());
        this.tab0playercombobox.setOnAction(e -> this.onComboboxAction());
        EventHandler onFieldTextChangedListener = e -> {
            if (this.tab0wantedmoneyfield.getText().contains("-") || this.tab0offermoneyfield.getText().contains("-")) {
                this.tab0wantedmoneyfield.setText(this.tab0wantedmoneyfield.getText().replace("-", ""));
                this.tab0offermoneyfield.setText(this.tab0offermoneyfield.getText().replace("-", ""));
            }
            try {
                this.senderMoney = Integer.parseInt(this.tab0offermoneyfield.getText());
            }
            catch (NumberFormatException exc) {
                this.senderMoney = 0;
            }
            try {
                this.receiverMoney = Integer.parseInt(this.tab0wantedmoneyfield.getText());
            }
            catch (NumberFormatException exc) {
                this.receiverMoney = 0;
            }
            this.updateTab0();
        };
        this.tab0offermoneyfield.setOnKeyPressed(onFieldTextChangedListener);
        this.tab0wantedmoneyfield.setOnKeyPressed(onFieldTextChangedListener);
        this.tab0offermoneyfield.setOnKeyReleased(onFieldTextChangedListener);
        this.tab0wantedmoneyfield.setOnKeyReleased(onFieldTextChangedListener);
        this.tab0offermoneyfield.focusedProperty().addListener(e -> onFieldTextChangedListener.handle(null));
        this.tab0wantedmoneyfield.focusedProperty().addListener(e -> onFieldTextChangedListener.handle(null));
        this.tab0wantedmoneyfield.setOnKeyPressed(onFieldTextChangedListener);
        this.tab0offerselectedlink.setOnAction(e -> this.tabpane.getSelectionModel().select(this.tab1));
        this.tab0wantedselectedlink.setOnAction(e -> this.tabpane.getSelectionModel().select(this.tab2));
        ImageView crossView = new ImageView(DataLoader.getInstance().getGameImage(GameImage.CROSS));
        crossView.setFitHeight(25.0);
        crossView.setFitWidth(25.0);
        this.cancelButton.setGraphic((Node)crossView);
        this.cancelButton.setCursor(Cursor.HAND);
        ImageView editImg = new ImageView(DataLoader.getInstance().getGameImage(GameImage.EDIT));
        editImg.setFitHeight(25.0);
        editImg.setFitWidth(25.0);
        this.editButton.setGraphic((Node)editImg);
        this.editButton.setCursor(Cursor.HAND);
        ImageView checkImg = new ImageView(DataLoader.getInstance().getGameImage(GameImage.EXCHANGE));
        checkImg.setFitHeight(25.0);
        checkImg.setFitWidth(25.0);
        this.makeOfferButton.setGraphic((Node)checkImg);
        this.makeOfferButton.setCursor(Cursor.HAND);
        this.updateAllTexts();
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
        if (this.isModeReceiving) {
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
        if (this.isModeReceiving) {
            this.tab0playercombobox.setVisible(false);
            textSelectedCardsSender = this.res.getString("tab0recofferselectedlink");
            textSelectedCardsReceiver = this.res.getString("tab0recofferselectedlink");
            this.tab0partnerlabel.setText(this.res.getString("tab0recpartnerlabel"));
            if (this.attachment != null && this.attachment.getStatus() == SwapOfferAction.Status.CHANGED_BY_RECEIVER) {
                this.tab0partnerlabel.setText(String.format(this.tab0partnerlabel.getText(), this.receiver.getName()));
            } else {
                this.tab0partnerlabel.setText(String.format(this.tab0partnerlabel.getText(), this.sender.getName()));
            }
        } else {
            this.tab0playercombobox.setVisible(true);
            this.editButton.setVisible(false);
        }
        if (this.attachment != null && this.attachment.getStatus().equals(SwapOfferAction.Status.CHANGED_BY_RECEIVER)) {
            textSelectedCardsSender = String.format(textSelectedCardsSender, this.receiverSelectedProperties.size());
            textSelectedCardsReceiver = String.format(textSelectedCardsReceiver, this.senderSelectedProperties.size());
        } else {
            textSelectedCardsSender = String.format(textSelectedCardsSender, this.senderSelectedProperties.size());
            textSelectedCardsReceiver = String.format(textSelectedCardsReceiver, this.receiverSelectedProperties.size());
        }
        this.tab0offerselectedlink.setText(textSelectedCardsSender);
        this.tab0wantedselectedlink.setText(textSelectedCardsReceiver);
        int offerValue = 0;
        int wishedValue = 0;
        for (Property prop : this.senderSelectedProperties) {
            offerValue += prop.getPrice();
        }
        for (Property prop : this.receiverSelectedProperties) {
            wishedValue += prop.getPrice();
        }
        int diff = Math.abs(this.senderMoney + offerValue - this.receiverMoney - wishedValue);
        this.tab0offeredvalluelabel.setText(String.valueOf(offerValue));
        this.tab0wantedvaluelabl.setText(String.valueOf(wishedValue));
        this.tab0diffvaluelabel.setText(String.valueOf(diff));
    }

    private void onComboboxAction() {
        int selInd = this.tab0playercombobox.getSelectionModel().getSelectedIndex();
        if (selInd == -1) {
            return;
        }
        Player newReceiver = this.otherPlayers.get(selInd);
        if (newReceiver.equals(this.receiver)) {
            return;
        }
        this.receiver = newReceiver;
        this.receiverSelectedProperties.clear();
        this.updateTab2();
        this.updateTab0();
    }

    public final int getReceiverMoney() {
        return this.receiverMoney;
    }

    public final ObservableList<Property> getReceiverSelectedProperties() {
        return this.receiverSelectedProperties;
    }

    public final int getSenderMoney() {
        return this.senderMoney;
    }

    public final ObservableList<Property> getSenderSelectedProperties() {
        return this.senderSelectedProperties;
    }

    public final void setUpNewOffer(Player client, Property property, List<Player> allPlayers) {
        this.isModeReceiving = false;
        allPlayers.removeIf(client::equals);
        this.otherPlayers = new ArrayList<Player>(allPlayers);
        ObservableList playerNames = FXCollections.observableArrayList();
        for (Player p : allPlayers) {
            playerNames.add(p.getName());
        }
        this.tab0playercombobox.setItems(playerNames);
        this.sender = client;
        if (property.getOwner().equals(client)) {
            this.senderSelectedProperties.addAll(new Property[]{property});
            this.tab0playercombobox.getSelectionModel().select(0);
            this.receiver = allPlayers.get(this.tab0playercombobox.getSelectionModel().getSelectedIndex());
        } else {
            this.receiver = property.getOwner();
            this.receiverSelectedProperties.addAll(new Property[]{property});
            this.tab0playercombobox.getSelectionModel().select(this.otherPlayers.indexOf(this.receiver));
        }
        this.updateTab0();
        this.updateTab1();
        this.updateTab2();
    }

    public void setUpNewOffer(Player client, Player selectedReceiver, List<Player> allPlayers) {
        this.isModeReceiving = false;
        allPlayers.removeIf(client::equals);
        this.otherPlayers = new ArrayList<Player>(allPlayers);
        ObservableList playerNames = FXCollections.observableArrayList();
        for (Player p : allPlayers) {
            playerNames.add(p.getName());
        }
        this.sender = client;
        this.receiver = selectedReceiver;
        this.tab0playercombobox.setItems(playerNames);
        this.tab0playercombobox.getSelectionModel().select(this.otherPlayers.indexOf(this.receiver));
        this.updateTab0();
        this.updateTab1();
        this.updateTab2();
    }

    public void setUpReceived(Player client, Player creator, Collection<Property> offeredProps, Collection<Property> desiredProps, int moneySender, int moneyReceiver) {
        this.isModeReceiving = true;
        this.tab0offermoneyfield.setDisable(true);
        this.tab0wantedmoneyfield.setDisable(true);
        this.tab0playercombobox.setVisible(false);
        this.sender = creator;
        this.receiver = client;
        this.senderMoney = moneySender;
        this.receiverMoney = moneyReceiver;
        this.receiverSelectedProperties = FXCollections.observableArrayList(desiredProps);
        this.senderSelectedProperties = FXCollections.observableArrayList(offeredProps);
        this.otherPlayers = Arrays.asList(creator);
        this.tab0playercombobox.setItems(FXCollections.observableArrayList(creator.getName()));
        this.tab0playercombobox.getSelectionModel().select(0);
        this.tab0offermoneyfield.setText(moneySender + "");
        this.tab0wantedmoneyfield.setText(moneyReceiver + "");
        this.overrideReceivingTexts();
        this.updateTab0();
        this.updateTab1();
        this.updateTab2();
    }

    public final void setOnCancelListener(Runnable onCancelListener) {
        this.cancelButton.setOnAction(e -> onCancelListener.run());
    }

    public final void setOnDoneListener(Runnable onDoneListener) {
        this.makeOfferButton.setOnAction(e -> onDoneListener.run());
    }

    public final void setOnEditListener(Runnable onEditListener) {
        this.editButton.setOnAction(e -> onEditListener.run());
    }

    public void editThisOffer() {
        if (!this.isModeReceiving) {
            throw new IllegalStateException("Not in receiving swap offer. Can not switch to edit mode.");
        }
        this.isModeReceiving = false;
        Player oldReceiver = this.receiver;
        this.receiver = this.sender;
        this.sender = oldReceiver;
        ObservableList<Property> oldReceiverProps = this.receiverSelectedProperties;
        this.receiverSelectedProperties = this.senderSelectedProperties;
        this.senderSelectedProperties = oldReceiverProps;
        int oldReceiverMoney = this.receiverMoney;
        this.receiverMoney = this.senderMoney;
        this.senderMoney = oldReceiverMoney;
        this.tab0offermoneyfield.setText(this.senderMoney + "");
        this.tab0wantedmoneyfield.setText(this.receiverMoney + "");
        this.tab0offermoneyfield.setDisable(false);
        this.tab0wantedmoneyfield.setDisable(false);
        this.tab0playercombobox.setItems(FXCollections.observableArrayList(this.receiver.getName()));
        this.tab0playercombobox.getSelectionModel().select(0);
        this.updateAllTexts();
        this.updateTab0();
        this.updateTab1();
        this.updateTab2();
    }

    private void updateTab2() {
        if (this.needToInvert()) {
            this.tab2receiverlistview.setItems(FXCollections.observableArrayList(this.senderSelectedProperties));
            this.tab2receiverlistview.setCellFactory(list -> new PropertyCardCellRenderer((List<Property>)this.senderSelectedProperties, !this.isModeReceiving, false));
        } else {
            ArrayList<Property> allowedProps = new ArrayList<Property>(this.receiver.getPropertyList());
            allowedProps.removeIf(prop -> prop instanceof Street && !((Street)prop).getBuildings().isEmpty());
            this.tab2receiverlistview.setItems(FXCollections.observableArrayList(allowedProps));
            this.tab2receiverlistview.setCellFactory(list -> new PropertyCardCellRenderer((List<Property>)this.receiverSelectedProperties));
        }
    }

    private void updateTab1() {
        if (this.needToInvert()) {
            this.tab1senderlistview.setItems(FXCollections.observableArrayList(this.receiverSelectedProperties));
            this.tab1senderlistview.setCellFactory(list -> new PropertyCardCellRenderer((List<Property>)this.receiverSelectedProperties, !this.isModeReceiving, false));
        } else {
            ArrayList<Property> allowedProps = new ArrayList<Property>(this.sender.getPropertyList());
            allowedProps.removeIf(prop -> prop instanceof Street && !((Street)prop).getBuildings().isEmpty());
            this.tab1senderlistview.setItems(FXCollections.observableArrayList(allowedProps));
            this.tab1senderlistview.setCellFactory(list -> new PropertyCardCellRenderer((List<Property>)this.senderSelectedProperties));
        }
    }

    private boolean needToInvert() {
        return this.attachment != null && this.attachment.getStatus().equals(SwapOfferAction.Status.SENT);
    }

    public final AnchorPane getRootPane() {
        return this.rootPane;
    }

    public final Player getSender() {
        return this.sender;
    }

    public final Player getReceiver() {
        return this.receiver;
    }

    public final int[] getReceiverSelectedPropertiesPositions() {
        int[] selPropInd = new int[this.receiverSelectedProperties.size()];
        for (int i = 0; i < selPropInd.length; ++i) {
            selPropInd[i] = ((Property)this.receiverSelectedProperties.get(i)).getPosition();
        }
        return selPropInd;
    }

    public final int[] getSenderSelectedPropertiesPositions() {
        int[] selPropInd = new int[this.senderSelectedProperties.size()];
        for (int i = 0; i < selPropInd.length; ++i) {
            selPropInd[i] = ((Property)this.senderSelectedProperties.get(i)).getPosition();
        }
        return selPropInd;
    }

    public String toString() {
        StringBuffer sb = new StringBuffer("de.hhn.seb.labsw.laspoly.view.game.gamescene.SwapOfferController{");
        sb.append("receiverSelectedProperties=").append(this.receiverSelectedProperties);
        sb.append(", receiverMoney=").append(this.receiverMoney);
        sb.append(", receiver=").append(this.receiver);
        sb.append(", sender=").append(this.sender);
        sb.append(", senderMoney=").append(this.senderMoney);
        sb.append(", senderSelectedProperties=").append(this.senderSelectedProperties);
        sb.append('}');
        return sb.toString();
    }
}

