import telebot
from telebot import types

# Замени 'YOUR_BOT_TOKEN' на токен твоего бота
TOKEN = '7592086436:AAFVBrPEvZy9L-yNSZM3NbCy--xaaT3MpHE'
bot = telebot.TeleBot(TOKEN)

@bot.message_handler(commands=['start'])
def send_welcome(message):
    # Создаем кнопку для открытия Mini App
    keyboard = types.InlineKeyboardMarkup()
    web_app = types.WebAppInfo(url="https://heroic-tartufo-d094d1.netlify.app")
    button = types.InlineKeyboardButton(text="Open ZapBit", web_app=web_app)
    keyboard.add(button)
    
    bot.reply_to(message, "Welcome to ZapBit! Click the button below to open the Mini App.", reply_markup=keyboard)

# Запускаем бота
bot.polling()